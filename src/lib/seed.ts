import { hashPassword, passwordIsStrong, verifyPassword } from "./auth";
import { sql } from "./db";
import { FORMAT_CATALOG } from "./format-catalog";
import { id } from "./ids";

type DemoUser = {
  email: string;
  password: string;
  name: string;
  role: "superusuario" | "ejecutivo";
};

function readSecret(name: string): string | null {
  const value = process.env[name]?.trim() ?? "";
  if (!passwordIsStrong(value)) return null;
  return value;
}

function readEmail(name: string): string | null {
  const value = process.env[name]?.trim().toLowerCase() ?? "";
  if (!/^[^\s@]+@[^\s@]+$/.test(value) || value.length > 200) return null;
  return value;
}

function demoUsers(): DemoUser[] {
  const superPassword = readSecret("BIM_SUPER_PASSWORD");
  const superEmail = readEmail("BIM_SUPER_EMAIL");
  const ejecutivoPassword = readSecret("BIM_EJECUTIVO_PASSWORD");
  const ejecutivoEmail = readEmail("BIM_EJECUTIVO_EMAIL");
  const users: DemoUser[] = [];
  if (superPassword && superEmail) {
    users.push({
      email: superEmail,
      password: superPassword,
      name: "Superusuario",
      role: "superusuario",
    });
  }
  if (ejecutivoPassword && ejecutivoEmail && ejecutivoEmail !== superEmail) {
    users.push({
      email: ejecutivoEmail,
      password: ejecutivoPassword,
      name: "Ejecutivo Norte",
      role: "ejecutivo",
    });
  }
  const secondPassword = readSecret("BIM_EJECUTIVO2_PASSWORD");
  const secondEmail = readEmail("BIM_EJECUTIVO2_EMAIL");
  const used = new Set(users.map((user) => user.email));
  if (secondPassword && secondEmail && !used.has(secondEmail)) {
    users.push({
      email: secondEmail,
      password: secondPassword,
      name: "Ejecutivo Norte 2",
      role: "ejecutivo",
    });
  }
  return users;
}

const STAFF_ROTATION = "ensayo-3";

async function replaceStaffOnce(keepIds: string[], ejecutivoId: string) {
  if ((process.env.BIM_REPLACE_STAFF?.trim() ?? "") !== STAFF_ROTATION) return;
  if (keepIds.length < 3 || !ejecutivoId) return;
  await sql(
    `create table if not exists bim_flags (
       key text primary key,
       value text not null,
       updated_at timestamptz not null default now()
     )`,
  );
  await sql(
    "alter table bim_flags add column if not exists updated_at timestamptz not null default now()",
  );
  const done = await sql<{ value: string }>("select value from bim_flags where key = 'staff_rotation'");
  if (done[0]?.value === STAFF_ROTATION) return;

  const userSlots = keepIds.map((_, index) => `$${index + 1}`).join(", ");
  const businessSlots = keepIds.map((_, index) => `$${index + 2}`).join(", ");
  await sql(
    `update businesses set ejecutivo_id = $1 where ejecutivo_id not in (${businessSlots})`,
    [ejecutivoId, ...keepIds],
  );
  await sql(
    `update requests set cliente_user_id = null
     where cliente_user_id is not null and cliente_user_id not in (${userSlots})`,
    keepIds,
  );
  await sql(`delete from users where id not in (${userSlots})`, keepIds);
  await sql(
    `insert into bim_flags (key, value) values ('staff_rotation', $1)
     on conflict (key) do update set value = excluded.value, updated_at = now()`,
    [STAFF_ROTATION],
  );
}

let seedPromise: Promise<void> | null = null;

export async function seedDemoData() {
  if (!seedPromise) {
    seedPromise = runSeed().catch((error) => {
      seedPromise = null;
      throw error;
    });
  }
  await seedPromise;
}

async function runSeed() {
  await ensureFormatTemplates();
  const users = demoUsers();
  if (!users.length) return;

  const regionNorte = id("reg");
  const regionCentro = id("reg");
  await sql("insert into regions (id, name) values ($1,$2) on conflict (name) do nothing", [
    regionNorte,
    "Norte",
  ]);
  await sql("insert into regions (id, name) values ($1,$2) on conflict (name) do nothing", [
    regionCentro,
    "Centro",
  ]);

  const regions = await sql<{ id: string; name: string }>("select id, name from regions");
  const norte = regions.find((r) => r.name === "Norte")?.id || regionNorte;

  const keepIds: string[] = [];
  let ejecutivoId = "";
  for (const u of users) {
    const regionId = u.role === "ejecutivo" ? norte : null;
    const stored = await sql<{ id: string; password_hash: string }>(
      "select id, password_hash from users where lower(email) = lower($1) limit 1",
      [u.email],
    );
    let userId = stored[0]?.id ?? "";
    if (stored[0]) {
      const nextHash = verifyPassword(u.password, stored[0].password_hash)
        ? stored[0].password_hash
        : hashPassword(u.password);
      await sql(
        "update users set email = $1, name = $2, role = $3, region_id = $4, password_hash = $5 where id = $6",
        [u.email, u.name, u.role, regionId, nextHash, stored[0].id],
      );
    } else {
      userId = id("usr");
      await sql(
        `insert into users (id, email, name, role, password_hash, region_id)
         values ($1,$2,$3,$4,$5,$6)`,
        [userId, u.email, u.name, u.role, hashPassword(u.password), regionId],
      );
    }
    keepIds.push(userId);
    if (u.role === "ejecutivo" && !ejecutivoId) ejecutivoId = userId;
  }

  await replaceStaffOnce(keepIds, ejecutivoId);
  if (!ejecutivoId) return;

  const bizCount = await sql<{ c: string }>("select count(*)::text as c from businesses");
  if (Number(bizCount[0]?.c || 0) === 0) {
    const businessId = id("neg");
    await sql(
      `insert into businesses (
        id, folio, nombre, tipo_contrato, credito_bim, descripcion,
        patrimonio_tipo, patrimonio_valor, patrimonio_desc,
        honorarios_aceptacion, honorarios_admin, fines,
        ejecutivo_id, formatos, status, region_id
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb,$15,$16)
      on conflict (folio) do nothing`,
      [
        businessId,
        "FIDE-2026-0142",
        "Fideicomiso Desarrollo Residencial Valle Alto",
        "Fideicomiso",
        true,
        "Negocio demo de originación fiduciaria con crédito BIM.",
        "Inmueble",
        "$48,500,000 MXN",
        "Terreno habitacional 12,400 m² en Monterrey, N.L.",
        "$75,000",
        "$18,000 mensuales",
        "Administración y garantía de desarrollo inmobiliario",
        ejecutivoId,
        JSON.stringify(["alta_checklist", "caratula_ofid", "kyc_pf", "aviso_privacidad"]),
        "en_proceso",
        norte,
      ],
    );
  }
}

async function ensureFormatTemplates() {
  for (const fmt of FORMAT_CATALOG) {
    const existing = await sql<{ id: string }>(
      "select id from format_templates where format_key = $1",
      [fmt.key],
    );
    let templateId = existing[0]?.id;
    if (!templateId) {
      templateId = id("fmt");
      await sql(
        `insert into format_templates (id, format_key, title, code, description)
         values ($1,$2,$3,$4,$5)`,
        [templateId, fmt.key, fmt.title, fmt.code, "Parametrización demo"],
      );
    }
    for (let i = 0; i < fmt.fields.length; i++) {
      const f = fmt.fields[i];
      await sql(
        `insert into format_fields (id, template_id, field_key, label, source_type, source_path, sort_order)
         values ($1,$2,$3,$4,$5,$6,$7)
         on conflict (template_id, field_key) do nothing`,
        [id("fld"), templateId, f.field_key, f.label, f.source_type, f.source_path, i],
      );
    }
  }
}

