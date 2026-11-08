import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { ensureSeed, sql } from "./db";
import { authCodeDigest, id as makeId, sessionToken } from "./ids";

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

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 32;

export const MIN_PASSWORD_LENGTH = 12;
const MAX_LOGIN_FAILURES = 5;

export type LoginResult =
  | { ok: true; user: SessionUser }
  | { ok: false; reason: "invalid" | "locked" };

type AttemptChannel = "password" | "code";

function subjectOf(email: string): string {
  return email.trim().toLowerCase().slice(0, 200);
}

let attemptsReady: Promise<void> | null = null;

function ensureAttemptsTable(): Promise<void> {
  if (!attemptsReady) {
    attemptsReady = sql(
      `create table if not exists login_attempts (
         subject text not null,
         channel text not null check (channel in ('password', 'code')),
         failures integer not null default 0,
         locked_until timestamptz,
         updated_at timestamptz not null default now(),
         primary key (subject, channel)
       )`,
    )
      .then(() => undefined)
      .catch((error: unknown) => {
        attemptsReady = null;
        throw error;
      });
  }
  return attemptsReady;
}

async function gateAttempt(subject: string, channel: AttemptChannel): Promise<"ok" | "locked"> {
  try {
    await ensureAttemptsTable();
    const rows = await sql<{ locked_until: string | null }>(
      "select locked_until from login_attempts where subject = $1 and channel = $2",
      [subject, channel],
    );
    const lockedUntil = rows[0]?.locked_until;
    if (!lockedUntil) return "ok";
    if (new Date(lockedUntil).getTime() > Date.now()) return "locked";
    await sql(
      "update login_attempts set failures = 0, locked_until = null, updated_at = now() where subject = $1 and channel = $2",
      [subject, channel],
    );
    return "ok";
  } catch {
    return "ok";
  }
}

async function registerFailure(subject: string, channel: AttemptChannel): Promise<"invalid" | "locked"> {
  try {
    await ensureAttemptsTable();
    const rows = await sql<{ failures: number }>(
      `insert into login_attempts (subject, channel, failures, locked_until, updated_at)
       values ($1, $2, 1, null, now())
       on conflict (subject, channel) do update
       set failures = login_attempts.failures + 1,
           locked_until = case
             when login_attempts.failures + 1 >= $3 then now() + interval '15 minutes'
             else null
           end,
           updated_at = now()
       returning failures`,
      [subject, channel, MAX_LOGIN_FAILURES],
    );
    const failures = Number(rows[0]?.failures ?? 1);
    if (channel === "code" && failures >= MAX_LOGIN_FAILURES) {
      await sql(
        "update requests set auth_code = null, auth_code_expires = null where lower(cliente_email) = lower($1) and auth_code is not null",
        [subject],
      );
    }
    return failures >= MAX_LOGIN_FAILURES ? "locked" : "invalid";
  } catch {
    return "invalid";
  }
}

async function registerSuccess(subject: string, channel: AttemptChannel) {
  try {
    await ensureAttemptsTable();
    await sql(
      "update login_attempts set failures = 0, locked_until = null, updated_at = now() where subject = $1 and channel = $2",
      [subject, channel],
    );
  } catch {
    return;
  }
}

export function passwordIsStrong(password: string): boolean {
  return password.trim().length >= MIN_PASSWORD_LENGTH;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

const DUMMY_PASSWORD_HASH = hashPassword(randomBytes(32).toString("base64url"));

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (n !== SCRYPT_N || r !== SCRYPT_R || p !== SCRYPT_P) return false;
  const salt = Buffer.from(parts[4], "base64url");
  const expected = Buffer.from(parts[5], "base64url");
  if (salt.length !== 16 || expected.length !== SCRYPT_KEYLEN) return false;
  const actual = scryptSync(password, salt, SCRYPT_KEYLEN, { N: n, r, p });
  return timingSafeEqual(actual, expected);
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

export async function login(email: string, password: string): Promise<LoginResult> {
  await ensureSeed();
  const subject = subjectOf(email);
  if (!subject || !password) return { ok: false, reason: "invalid" };
  if ((await gateAttempt(subject, "password")) === "locked") return { ok: false, reason: "locked" };

  const rows = await sql<{
    id: string;
    email: string;
    name: string;
    role: Role;
    password_hash: string;
    region_id: string | null;
  }>(
    "select id, email, name, role, password_hash, region_id from users where lower(email) = lower($1) limit 1",
    [subject],
  );
  const user = rows[0];
  const staff = user && user.role !== "cliente" ? user : null;
  const passwordOk = staff ? verifyPassword(password, staff.password_hash) : false;
  if (!staff) verifyPassword(password, DUMMY_PASSWORD_HASH);
  if (!staff || !passwordOk) {
    return { ok: false, reason: await registerFailure(subject, "password") };
  }
  await registerSuccess(subject, "password");
  await createSession(staff.id);
  return {
    ok: true,
    user: {
      id: staff.id,
      email: staff.email,
      name: staff.name,
      role: staff.role,
      region_id: staff.region_id,
    },
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

export async function loginWithAuthCode(email: string, code: string): Promise<LoginResult> {
  await ensureSeed();
  const subject = subjectOf(email);
  const normalizedCode = code.trim().replace(/\s+/g, "");
  if (!subject) return { ok: false, reason: "invalid" };
  if ((await gateAttempt(subject, "code")) === "locked") return { ok: false, reason: "locked" };
  if (normalizedCode.length < 20 || normalizedCode.length > 128) {
    return { ok: false, reason: await registerFailure(subject, "code") };
  }

  const rows = await sql<{
    id: string;
    cliente_nombre: string;
    auth_code: string | null;
    auth_code_expires: string | null;
    cliente_user_id: string | null;
  }>(
    `select id, cliente_nombre, auth_code, auth_code_expires, cliente_user_id
     from requests
     where lower(cliente_email) = lower($1) and auth_code = $2
     order by created_at desc
     limit 1`,
    [subject, authCodeDigest(normalizedCode)],
  );
  const req = rows[0];
  if (!req?.auth_code) {
    return { ok: false, reason: await registerFailure(subject, "code") };
  }
  if (req.auth_code_expires && new Date(req.auth_code_expires).getTime() < Date.now()) {
    await sql("update requests set auth_code = null, auth_code_expires = null where id = $1", [req.id]);
    return { ok: false, reason: await registerFailure(subject, "code") };
  }

  let userId = req.cliente_user_id;
  if (userId) {
    const linked = await sql<{ role: Role }>("select role from users where id = $1", [userId]);
    if (linked[0]?.role !== "cliente") {
      await sql("update requests set auth_code = null, auth_code_expires = null where id = $1", [req.id]);
      return { ok: false, reason: await registerFailure(subject, "code") };
    }
  } else {
    const existing = await sql<{ id: string; role: Role }>(
      "select id, role from users where lower(email) = lower($1) limit 1",
      [subject],
    );
    if (existing[0] && existing[0].role !== "cliente") {
      await sql("update requests set auth_code = null, auth_code_expires = null where id = $1", [req.id]);
      return { ok: false, reason: await registerFailure(subject, "code") };
    }
    if (existing[0]) {
      userId = existing[0].id;
    } else {
      userId = makeId("usr");
      await sql(
        "insert into users (id, email, name, role, password_hash) values ($1,$2,$3,'cliente',$4)",
        [userId, subject, req.cliente_nombre || subject, hashPassword(randomBytes(32).toString("base64url"))],
      );
    }
  }

  const userRows = await sql<SessionUser>(
    "select id, email, name, role, region_id from users where id = $1",
    [userId],
  );
  const user = userRows[0];
  if (!user || user.role !== "cliente") {
    return { ok: false, reason: await registerFailure(subject, "code") };
  }

  await sql(
    "update requests set auth_code = null, auth_code_expires = null, cliente_user_id = $1 where id = $2",
    [user.id, req.id],
  );
  await registerSuccess(subject, "code");
  await createSession(user.id);
  return { ok: true, user };
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
