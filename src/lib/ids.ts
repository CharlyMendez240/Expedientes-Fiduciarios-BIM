import { createHash, randomBytes } from "node:crypto";

export function id(prefix = ""): string {
  const raw = randomBytes(12).toString("hex");
  return prefix ? `${prefix}_${raw}` : raw;
}

export function inviteToken(): string {
  return randomBytes(18).toString("base64url");
}

export function sessionToken(): string {
  return randomBytes(24).toString("base64url");
}

/** Código de un solo uso. No es un PIN corto: hay que adivinar 18 bytes al azar. */
export function authCode(): string {
  return randomBytes(18).toString("base64url");
}

export function authCodeDigest(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}
