import { loginWithAuthCode } from "@/lib/auth";
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
  if (!postOriginAllowed(request)) return redirectWithSession(request, "/cliente/acceso?error=server");
  let email = "";
  try {
    const form = await request.formData();
    email = safeEmail(String(form.get("email") || ""));
    const code = String(form.get("auth_code") || "");
    const result = await loginWithAuthCode(email, code);
    if (!result.ok) {
      const params = new URLSearchParams({ error: result.reason === "locked" ? "locked" : "1" });
      if (email) params.set("email", email);
      return redirectWithSession(request, `/cliente/acceso?${params.toString()}`);
    }
    return redirectWithSession(request, "/cliente/carga", result.token);
  } catch (error) {
    console.error("login", pgCode(error) || "error");
    const params = new URLSearchParams({ error: "server" });
    if (email) params.set("email", email);
    return redirectWithSession(request, `/cliente/acceso?${params.toString()}`);
  }
}
