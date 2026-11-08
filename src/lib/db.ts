import { mkdir, readdir, readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
let pool: pg.Pool | undefined;
let local: Promise<PGlite> | undefined;
let seeded = false;

export async function sql<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  if (databaseUrl !== "") {
    pool ??= new pg.Pool({ connectionString: databaseUrl, max: 5 });
    return (await pool.query(text, params)).rows as T[];
  }
  local ??= startLocal().catch((error: unknown) => {
    local = undefined;
    throw error;
  });
  return (await (await local).query<T>(text, params)).rows;
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
  if (seeded) return;
  const { seedDemoData } = await import("./seed");
  await seedDemoData();
  seeded = true;
}
