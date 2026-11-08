"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  canAccessBusiness,
  getSession,
  hashPassword,
  passwordIsStrong,
  login as doLogin,
  loginWithAuthCode,
  logout as doLogout,
  type SessionUser,
} from "./auth";
import { ensureSeed, sql } from "./db";
import { buildClientInviteEmail } from "./email";
import { CLIENT_REQUEST_TAB, clientRequestDocs, tabByKey } from "./expediente-tabs";
import { authCode, id, inviteToken } from "./ids";
import { resolveFormatFields } from "./resolve-fields";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

async function loadBusinessForUser(user: SessionUser, businessId: string) {
  const rows = await sql<{
    id: string;
    ejecutivo_id: string;
    region_id: string | null;
    nombre: string;
    folio: string;
    [k: string]: unknown;
  }>("select * from businesses where id = $1", [businessId]);
  const business = rows[0];
  if (!business) return null;
  if (!(await canAccessBusiness(user, business))) return null;
  return business;
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const user = await doLogin(email, password);
  if (!user) redirect("/?error=1");
  if (user.role === "superusuario") redirect("/admin");
  if (user.role === "ejecutivo") redirect("/ejecutivo");
  redirect("/cliente/carga");
}

export async function logoutAction() {
  await doLogout();
  redirect("/");
}

export async function createBusinessAction(formData: FormData) {
  const user = await getSession();
  if (!user || (user.role !== "ejecutivo" && user.role !== "superusuario")) redirect("/");

  const businessId = id("neg");
  const folio = String(formData.get("folio") || "").trim() || `FIDE-${Date.now().toString().slice(-6)}`;

  await sql(
    `insert into businesses (
      id, folio, nombre, tipo_contrato, credito_bim, descripcion,
      patrimonio_tipo, patrimonio_valor, patrimonio_desc,
      honorarios_aceptacion, honorarios_admin, fines,
      ejecutivo_id, formatos, status, region_id
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb,$15,$16)`,
    [
      businessId,
      folio,
      String(formData.get("nombre") || "").trim(),
      String(formData.get("tipo_contrato") || "Fideicomiso"),
      formData.get("credito_bim") === "on",
      String(formData.get("descripcion") || ""),
      String(formData.get("patrimonio_tipo") || ""),
      String(formData.get("patrimonio_valor") || ""),
      String(formData.get("patrimonio_desc") || ""),
      String(formData.get("honorarios_aceptacion") || ""),
      String(formData.get("honorarios_admin") || ""),
      String(formData.get("fines") || ""),
      user.id,
      JSON.stringify(["alta_checklist", "caratula_ofid", "kyc_pf", "aviso_privacidad"]),
      "en_proceso",
      user.region_id,
    ],
  );

  revalidatePath("/ejecutivo");
  redirect(`/ejecutivo/negocios/${businessId}?tab=1`);
}

export async function uploadBusinessDocumentAction(businessId: string, formData: FormData) {
  await ensureSeed();
  const user = await getSession();
  if (!user) redirect("/");

  const business = await loadBusinessForUser(
    user.role === "cliente"
      ? { ...user, role: "ejecutivo", region_id: null }
      : user,
    businessId,
  ).catch(() => null);

  // cliente: verificar ownership por request
  if (user.role === "cliente") {
    const owned = await sql<{ id: string; requested_docs: unknown }>(
      `select id, requested_docs from requests where business_id = $1 and cliente_user_id = $2 limit 1`,
      [businessId, user.id],
    );
    if (!owned[0]) redirect("/cliente");
  } else {
    const biz = await sql<{ ejecutivo_id: string; region_id: string | null }>(
      "select ejecutivo_id, region_id from businesses where id = $1",
      [businessId],
    );
    if (!biz[0] || !(await canAccessBusiness(user, biz[0]))) redirect("/ejecutivo");
  }

  const tabKey = String(formData.get("tab_key") || "");
  const docKey = String(formData.get("doc_key") || "");
  const file = formData.get("file");
  const requestId = String(formData.get("request_id") || "") || null;
  const back =
    user.role === "cliente"
      ? `/cliente/carga?tab=${tabKey || CLIENT_REQUEST_TAB}`
      : `/ejecutivo/negocios/${businessId}?tab=${tabKey || "1"}`;

  if (!(file instanceof File) || !tabKey || !docKey) {
    redirect(back);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (file.size > MAX_UPLOAD_BYTES || buffer.length > MAX_UPLOAD_BYTES) {
    redirect(`${back}&upload_error=1`);
  }

  if (user.role === "cliente" && tabKey !== CLIENT_REQUEST_TAB) {
    redirect(`/cliente/carga?tab=${CLIENT_REQUEST_TAB}`);
  }

  const tab = tabByKey(tabKey);
  const label = tab?.documents.find((d) => d.key === docKey)?.label || docKey;
  const { mockExtract } = await import("./prefill");
  const extracted = mockExtract(docKey, file.name);

  await sql(
    "delete from business_documents where business_id = $1 and tab_key = $2 and doc_key = $3 and coalesce(request_id,'') = coalesce($4,'')",
    [businessId, tabKey, docKey, requestId],
  );
  await sql(
    `insert into business_documents (
      id, business_id, tab_key, doc_key, label, file_name, mime_type, content_base64, extracted, uploaded_by, request_id
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11)`,
    [
      id("bdoc"),
      businessId,
      tabKey,
      docKey,
      label,
      file.name,
      file.type || "application/octet-stream",
      buffer.toString("base64"),
      JSON.stringify(extracted),
      user.email,
      requestId,
    ],
  );

  if (requestId) {
    await sql(
      "update requests set status = case when status = 'pendiente' then 'cargado' else status end, updated_at = now() where id = $1",
      [requestId],
    );
  }

  void business;
  const dest =
    user.role === "cliente"
      ? `/cliente/carga?tab=${tabKey}`
      : `/ejecutivo/negocios/${businessId}?tab=${tabKey}`;
  revalidatePath(dest);
  redirect(dest);
}

export async function inviteClientAction(businessId: string, formData: FormData) {
  const user = await getSession();
  if (!user || (user.role !== "ejecutivo" && user.role !== "superusuario")) redirect("/");

  const business = await loadBusinessForUser(user, businessId);
  if (!business) redirect("/ejecutivo");

  const nombre = String(formData.get("cliente_nombre") || "").trim();
  const email = String(formData.get("cliente_email") || "").trim().toLowerCase();
  const allowed = clientRequestDocs().map((d) => d.key);
  const selected = allowed.filter((k) => formData.get(`doc_${k}`) === "on");

  if (!nombre || !email || !selected.length) {
    redirect(`/ejecutivo/negocios/${businessId}?tab=${CLIENT_REQUEST_TAB}&invite_error=1`);
  }

  let participantId: string;
  let requestId: string;
  let token: string;

  const existing = await sql<{
    participant_id: string;
    request_id: string;
    invite_token: string;
  }>(
    `select p.id as participant_id, r.id as request_id, r.invite_token
     from requests r
     join participants p on p.id = r.participant_id
     where r.business_id = $1 and lower(r.cliente_email) = lower($2)
     limit 1`,
    [businessId, email],
  );

  if (existing[0]) {
    participantId = existing[0].participant_id;
    requestId = existing[0].request_id;
    token = existing[0].invite_token;
    await sql("update participants set nombre = $1, email = $2 where id = $3", [
      nombre,
      email,
      participantId,
    ]);
  } else {
    participantId = id("par");
    await sql(
      `insert into participants (
        id, business_id, tipo_persona, nacionalidad, rol_negocio, nombre, email
      ) values ($1,$2,'PF','nacional','Fideicomitente',$3,$4)`,
      [participantId, businessId, nombre, email],
    );
    requestId = id("sol");
    token = inviteToken();
    await sql(
      `insert into requests (
        id, business_id, participant_id, invite_token, status, cliente_nombre, cliente_email, requested_docs
      ) values ($1,$2,$3,$4,'pendiente',$5,$6,$7::jsonb)`,
      [requestId, businessId, participantId, token, nombre, email, JSON.stringify(selected)],
    );
  }

  const code = authCode();
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await sql(
    `update requests
     set auth_code = $1, auth_code_expires = $2, email_sent_at = now(),
         cliente_nombre = $3, cliente_email = $4, requested_docs = $5::jsonb, updated_at = now()
     where id = $6`,
    [code, expires.toISOString(), nombre, email, JSON.stringify(selected), requestId],
  );

  const accessPath = `/cliente/acceso?email=${encodeURIComponent(email)}`;
  const mail = buildClientInviteEmail({
    clienteNombre: nombre,
    negocioNombre: String(business.nombre),
    folio: String(business.folio),
    authCode: code,
    accessPath,
  });

  const emailId = id("mail");
  await sql(
    `insert into outbound_emails (
      id, to_email, to_name, subject, body_html, auth_code, business_id, request_id
    ) values ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [emailId, email, nombre, mail.subject, mail.body_html, code, businessId, requestId],
  );

  revalidatePath(`/ejecutivo/negocios/${businessId}`);
  redirect(`/ejecutivo/negocios/${businessId}/correo/${emailId}`);
}

export async function loginWithCodeAction(formData: FormData) {
  const email = String(formData.get("email") || "");
  const code = String(formData.get("auth_code") || "");
  const result = await loginWithAuthCode(email, code);
  if (!result) redirect("/cliente/acceso?error=1");
  redirect("/cliente/carga");
}

export async function regenerateFormsAction(businessId: string) {
  const user = await getSession();
  if (!user || (user.role !== "ejecutivo" && user.role !== "superusuario")) redirect("/");
  const business = await loadBusinessForUser(user, businessId);
  if (!business) redirect("/ejecutivo");

  const participants = await sql<{ id: string }>(
    "select id from participants where business_id = $1 order by created_at",
    [businessId],
  );
  const templates = await sql<{
    id: string;
    format_key: string;
    title: string;
    code: string;
  }>("select id, format_key, title, code from format_templates where active = true");

  await sql("delete from generated_forms where business_id = $1", [businessId]);

  for (const tpl of templates) {
    const fields = await sql<{
      field_key: string;
      label: string;
      source_type: string;
      source_path: string;
      default_value: string;
    }>(
      `select field_key, label, source_type, source_path, default_value
       from format_fields where template_id = $1 order by sort_order, field_key`,
      [tpl.id],
    );

    const targets = participants.length ? participants : [{ id: null as unknown as string }];
    for (const part of targets) {
      const resolved = await resolveFormatFields({
        businessId,
        participantId: part.id,
        fields,
      });
      const rowsHtml = resolved
        .map(
          (r) => `<tr>
            <th>${escape(r.label)}</th>
            <td><input value="${escape(r.value)}" /></td>
            <td class="src">${escape(r.source)}</td>
          </tr>`,
        )
        .join("");
      const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"/><title>${escape(tpl.title)}</title>
        <style>
          body{font-family:Montserrat,Segoe UI,sans-serif;background:#eef3f3;color:#1a2e30;padding:24px}
          .sheet{max-width:920px;margin:0 auto;background:#fff;border:1px solid #d5e0e0;padding:28px}
          h1{color:#004848;font-size:22px}
          table{width:100%;border-collapse:collapse;margin-top:12px}
          th,td{border:1px solid #d5e0e0;padding:8px;font-size:13px}
          th{width:32%;background:#f2f7f7;text-align:left}
          input{width:100%;border:0;font:inherit}
          .src{width:28%;color:#5c7375;font-size:11px}
          .brand{color:#009c3c;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
        </style></head><body><article class="sheet">
        <div class="brand">BIM · Prefill parametrizado</div>
        <h1>${escape(tpl.title)}</h1>
        <div style="color:#5c7375;font-size:13px">${escape(tpl.code)}</div>
        <table>${rowsHtml}</table>
        <p style="color:#5c7375;font-size:12px">Valores desde captura manual y/o extracción documental según parametrización.</p>
        </article></body></html>`;

      await sql(
        `insert into generated_forms (id, business_id, participant_id, format_key, title, html_content, source_trace)
         values ($1,$2,$3,$4,$5,$6,$7::jsonb)`,
        [
          id("frm"),
          businessId,
          part.id,
          tpl.format_key,
          tpl.title,
          html,
          JSON.stringify(Object.fromEntries(resolved.map((r) => [r.field_key, r.source]))),
        ],
      );
    }
  }

  revalidatePath(`/ejecutivo/negocios/${businessId}`);
  redirect(`/ejecutivo/negocios/${businessId}?tab=1&forms=1`);
}

function escape(v: string) {
  return String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function validateClientDocsAction() {
  const user = await getSession();
  if (!user || user.role !== "cliente") redirect("/cliente/acceso");
  const requests = await sql<{ id: string }>(
    "select id from requests where cliente_user_id = $1 order by created_at desc limit 1",
    [user.id],
  );
  if (!requests[0]) redirect("/cliente/acceso");
  await sql(
    "update requests set status = 'validado', validated_at = now(), updated_at = now() where id = $1",
    [requests[0].id],
  );
  revalidatePath("/cliente/carga");
  redirect("/cliente/carga?ok=1");
}

export async function createUserAction(formData: FormData) {
  const user = await getSession();
  if (!user || user.role !== "superusuario") redirect("/");

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const name = String(formData.get("name") || "").trim();
  const role = String(formData.get("role") || "ejecutivo");
  const password = String(formData.get("password") || "").trim();
  const regionId = String(formData.get("region_id") || "") || null;

  if (!email || !name) redirect("/admin/usuarios?error=1");
  if (!passwordIsStrong(password)) redirect("/admin/usuarios?error=password");
  if (role !== "ejecutivo" && role !== "superusuario") redirect("/admin/usuarios?error=1");

  await sql(
    `insert into users (id, email, name, role, password_hash, region_id)
     values ($1,$2,$3,$4,$5,$6)`,
    [id("usr"), email, name, role, hashPassword(password), regionId],
  );
  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios?ok=1");
}

export async function updateUserRegionAction(formData: FormData) {
  const user = await getSession();
  if (!user || user.role !== "superusuario") redirect("/");
  const userId = String(formData.get("user_id") || "");
  const regionId = String(formData.get("region_id") || "") || null;
  await sql("update users set region_id = $1 where id = $2", [regionId, userId]);
  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}

export async function createRegionAction(formData: FormData) {
  const user = await getSession();
  if (!user || user.role !== "superusuario") redirect("/");
  const name = String(formData.get("name") || "").trim();
  if (!name) redirect("/admin/usuarios?error=1");
  await sql("insert into regions (id, name) values ($1,$2) on conflict (name) do nothing", [
    id("reg"),
    name,
  ]);
  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}

export async function updateFormatFieldAction(formData: FormData) {
  const user = await getSession();
  if (!user || user.role !== "superusuario") redirect("/");
  const fieldId = String(formData.get("field_id") || "");
  await sql(
    `update format_fields
     set label = $1, source_type = $2, source_path = $3, default_value = $4
     where id = $5`,
    [
      String(formData.get("label") || ""),
      String(formData.get("source_type") || "manual_negocio"),
      String(formData.get("source_path") || ""),
      String(formData.get("default_value") || ""),
      fieldId,
    ],
  );
  const tpl = String(formData.get("template_id") || "");
  revalidatePath(`/admin/formatos/${tpl}`);
  redirect(`/admin/formatos/${tpl}?ok=1`);
}

export async function addFormatFieldAction(formData: FormData) {
  const user = await getSession();
  if (!user || user.role !== "superusuario") redirect("/");
  const templateId = String(formData.get("template_id") || "");
  await sql(
    `insert into format_fields (id, template_id, field_key, label, source_type, source_path, default_value, sort_order)
     values ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      id("fld"),
      templateId,
      String(formData.get("field_key") || `campo_${Date.now()}`),
      String(formData.get("label") || "Nuevo campo"),
      String(formData.get("source_type") || "manual_negocio"),
      String(formData.get("source_path") || ""),
      String(formData.get("default_value") || ""),
      Number(formData.get("sort_order") || 99),
    ],
  );
  revalidatePath(`/admin/formatos/${templateId}`);
  redirect(`/admin/formatos/${templateId}`);
}
