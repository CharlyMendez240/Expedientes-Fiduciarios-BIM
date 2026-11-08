import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { ensureSeed, sql } from "./db";
import { sessionToken } from "./ids";

export type Role = "superusuario" | "ejecutivo" | "cliente";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  region_id: string | null;
};

const COOKIE = "bim_session";
const SESSION_DAYS = 14;

export function hashPassword(password: string): string {
  return createHash("sha256").update(`bim-demo:${password}`).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

async function createSession(userId: string) {
  const token = sessionToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await sql("insert into sessions (token, user_id, expires_at) values ($1, $2, $3)", [
    token,
    userId,
    expires.toISOString(),
  ]);
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function login(email: string, password: string): Promise<SessionUser | null> {
  await ensureSeed();
  const rows = await sql<{
    id: string;
    email: string;
    name: string;
    role: Role;
    password_hash: string;
    region_id: string | null;
  }>(
    "select id, email, name, role, password_hash, region_id from users where lower(email) = lower($1) limit 1",
    [email.trim()],
  );
  const user = rows[0];
  if (!user || !safeEqual(user.password_hash, hashPassword(password))) return null;
  await createSession(user.id);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    region_id: user.region_id,
  };
}

export async function logout() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    await sql("delete from sessions where token = $1", [token]);
    jar.delete(COOKIE);
  }
}

export async function getSession(): Promise<SessionUser | null> {
  await ensureSeed();
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const rows = await sql<SessionUser & { expires_at: string }>(
    `select u.id, u.email, u.name, u.role, u.region_id, s.expires_at
     from sessions s join users u on u.id = s.user_id
     where s.token = $1 limit 1`,
    [token],
  );
  const row = rows[0];
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await sql("delete from sessions where token = $1", [token]);
    return null;
  }
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    region_id: row.region_id,
  };
}

export async function loginWithAuthCode(
  email: string,
  code: string,
): Promise<{ user: SessionUser; requestId: string; inviteToken: string } | null> {
  await ensureSeed();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedCode = code.trim().replace(/\s+/g, "");
  const rows = await sql<{
    id: string;
    invite_token: string;
    cliente_email: string;
    cliente_nombre: string;
    auth_code: string | null;
    auth_code_expires: string | null;
    cliente_user_id: string | null;
  }>(
    `select id, invite_token, cliente_email, cliente_nombre, auth_code, auth_code_expires, cliente_user_id
     from requests
     where lower(cliente_email) = lower($1) and auth_code = $2
     order by created_at desc
     limit 1`,
    [normalizedEmail, normalizedCode],
  );
  const req = rows[0];
  if (!req?.auth_code) return null;
  if (req.auth_code_expires && new Date(req.auth_code_expires).getTime() < Date.now()) {
    return null;
  }

  let userId = req.cliente_user_id;
  if (!userId) {
    const existing = await sql<{ id: string }>(
      "select id from users where lower(email) = lower($1) limit 1",
      [normalizedEmail],
    );
    if (existing[0]) {
      userId = existing[0].id;
    } else {
      const { id: makeId } = await import("./ids");
      userId = makeId("usr");
      await sql(
        "insert into users (id, email, name, role, password_hash) values ($1,$2,$3,'cliente',$4)",
        [userId, normalizedEmail, req.cliente_nombre || normalizedEmail, hashPassword(normalizedCode)],
      );
    }
    await sql("update requests set cliente_user_id = $1 where id = $2", [userId, req.id]);
  }

  const userRows = await sql<SessionUser>(
    "select id, email, name, role, region_id from users where id = $1",
    [userId],
  );
  const user = userRows[0];
  if (!user) return null;
  await createSession(user.id);
  return { user, requestId: req.id, inviteToken: req.invite_token };
}

/** Negocios visibles: propio, misma región (ejecutivos) o todos (superusuario). */
export async function canAccessBusiness(
  user: SessionUser,
  business: { ejecutivo_id: string; region_id: string | null },
): Promise<boolean> {
  if (user.role === "superusuario") return true;
  if (user.role !== "ejecutivo") return false;
  if (business.ejecutivo_id === user.id) return true;
  if (user.region_id && business.region_id && user.region_id === business.region_id) return true;
  return false;
}
