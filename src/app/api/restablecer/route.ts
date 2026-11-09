import { lookupPasswordAccount, rejectUnknownReset, resetStaffPassword } from "@/lib/auth";
import { pgCode } from "@/lib/db";
import { postOriginAllowed, redirectWithSession } from "@/lib/post-redirect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeEmail(value: string): string {
  const email = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+$/.test(email) || email.length > 200) return "";
  return email;
}

export async function POST(request: Request) {
  if (!postOriginAllowed(request, { requireOrigin: true })) {
    return redirectWithSession(request, "/restablecer?error=server");
  }
  try {
    const form = await request.formData();
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");
    const confirm = String(form.get("confirm") || "");
    if (!password && !confirm) {
      const found = await lookupPasswordAccount(email);
      if (found.status === "locked") return redirectWithSession(request, "/restablecer?error=locked");
      if (found.status === "cliente") return redirectWithSession(request, "/restablecer?error=cliente");
      if (found.status !== "staff") {
        const reason = await rejectUnknownReset(email);
        return redirectWithSession(
          request,
          reason === "locked" ? "/restablecer?error=locked" : "/restablecer?error=1",
        );
      }
      return redirectWithSession(request, `/restablecer?correo=${encodeURIComponent(found.email)}`);
    }
    const result = await resetStaffPassword(email, password, confirm);
    if (result === "ok") return redirectWithSession(request, "/?listo=1", undefined, true);
    const correo = safeEmail(email);
    const error =
      result === "locked" ? "locked" : result === "weak" ? "debil" : result === "mismatch" ? "distinta" : "1";
    const keep = correo && (result === "weak" || result === "mismatch") ? `&correo=${encodeURIComponent(correo)}` : "";
    return redirectWithSession(request, `/restablecer?error=${error}${keep}`);
  } catch (error) {
    const code = pgCode(error);
    console.error("reset", code || "error");
    return redirectWithSession(request, code ? `/restablecer?error=server&code=${code}` : "/restablecer?error=server");
  }
}
