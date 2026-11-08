import { randomBytes } from "node:crypto";

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

/** Código de 6 dígitos para acceso del cliente por correo. */
export function authCode(): string {
  const n = randomBytes(3).readUIntBE(0, 3) % 1_000_000;
  return n.toString().padStart(6, "0");
}
