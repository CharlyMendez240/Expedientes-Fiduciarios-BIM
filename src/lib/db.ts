import { mkdir, readdir, readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
const globalForDb = globalThis as unknown as {
  bimPool?: pg.Pool;
  bimLocal?: Promise<PGlite>;
  bimSeeded?: boolean;
};

export function pgCode(error: unknown): string {
  if (!error || typeof error !== "object" || !("code" in error)) return "";
  const code = (error as { code: unknown }).code;
  return typeof code === "string" && /^[0-9A-Z]{5}$/.test(code) ? code : "";
}

export async function sql<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  if (databaseUrl !== "") {
    globalForDb.bimPool ??= new pg.Pool({ connectionString: databaseUrl, max: 5 });
    return (await globalForDb.bimPool.query(text, params)).rows as T[];
  }
  if (!globalForDb.bimLocal) {
    globalForDb.bimLocal = startLocal().catch((error: unknown) => {
      globalForDb.bimLocal = undefined;
      throw error;
    });
  }
  return (await (await globalForDb.bimLocal).query<T>(text, params)).rows;
}

const RUNTIME_SCHEMA = [
  `create table if not exists regions (
     id text primary key,
     name text not null unique,
     created_at timestamptz not null default now()
   )`,
  "alter table users add column if not exists region_id text",
  "alter table businesses add column if not exists region_id text",
  `create table if not exists sessions (
     token text primary key,
     user_id text not null references users(id) on delete cascade,
     created_at timestamptz not null default now(),
     expires_at timestamptz not null
   )`,
  "alter table sessions add column if not exists expires_at timestamptz",
  `create table if not exists login_attempts (
     subject text not null,
     channel text not null check (channel in ('password', 'code')),
     failures integer not null default 0,
     locked_until timestamptz,
     updated_at timestamptz not null default now(),
     primary key (subject, channel)
   )`,
  `create table if not exists bim_flags (
     key text primary key,
     value text not null,
     updated_at timestamptz not null default now()
   )`,
  "alter table bim_flags add column if not exists updated_at timestamptz not null default now()",
  `create table if not exists password_resets (
     id text primary key,
     user_id text not null references users(id) on delete cascade,
     token_hash text not null unique,
     expires_at timestamptz not null,
     created_at timestamptz not null default now()
   )`,
];

const globalSchema = globalThis as unknown as { bimSchema?: Promise<void> | null };

async function applyRuntimeSchema() {
  let failed = false;
  for (const statement of RUNTIME_SCHEMA) {
    try {
      await sql(statement);
    } catch (error) {
      failed = true;
      console.error("schema", pgCode(error) || "error");
    }
  }
  if (failed) throw new Error("schema");
}

export function ensureRuntimeSchema(): Promise<void> {
  if (!globalSchema.bimSchema) {
    globalSchema.bimSchema = applyRuntimeSchema().catch((error: unknown) => {
      globalSchema.bimSchema = null;
      console.error("schema", pgCode(error) || "error");
    });
  }
  return globalSchema.bimSchema;
}

async function applyMigrations(exec: (sql: string) => Promise<unknown>, query: <T>(sql: string, params?: unknown[]) => Promise<{ rows: T[] }>) {
  const files = (await readdir("migrations").catch(() => []))
    .filter((f) => f.endsWith(".sql"))
    .sort();
  await exec(
    "create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())",
  );
  const done = new Set(
    (await query<{ name: string }>("select name from schema_migrations")).rows.map((r) => r.name),
  );
  for (const file of files.filter((f) => !done.has(f))) {
    await exec(await readFile(`migrations/${file}`, "utf8"));
    await query("insert into schema_migrations (name) values ($1)", [file]);
  }
}

async function startLocal(): Promise<PGlite> {
  await mkdir("./.data/pgdata", { recursive: true });
  const db = new PGlite("./.data/pgdata");
  await applyMigrations(
    async (text) => {
      await db.exec(text);
    },
    async (text, params = []) => db.query(text, params),
  );
  return db;
}

export async function ensureSeed() {
  if (globalForDb.bimSeeded) return;
  await ensureRuntimeSchema();
  const { seedDemoData } = await import("./seed");
  await seedDemoData();
  globalForDb.bimSeeded = true;
}
