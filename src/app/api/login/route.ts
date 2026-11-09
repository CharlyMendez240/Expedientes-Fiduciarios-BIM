import { login } from "@/lib/auth";
import { pgCode } from "@/lib/db";
import { postOriginAllowed, redirectWithSession } from "@/lib/post-redirect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function staffPath(role: string): string {
  if (role === "superusuario") return "/admin";
  if (role === "ejecutivo") return "/ejecutivo";
  return "/";
}

export async function POST(request: Request) {
  if (!postOriginAllowed(request)) return redirectWithSession(request, "/?error=server");
  try {
    const form = await request.formData();
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");
    const result = await login(email, password);
    if (!result.ok) {
      return redirectWithSession(request, result.reason === "locked" ? "/?error=locked" : "/?error=1");
    }
    return redirectWithSession(request, staffPath(result.user.role), result.token);
  } catch (error) {
    const code = pgCode(error);
    console.error("login", code || "error");
    return redirectWithSession(request, code ? `/?error=server&code=${code}` : "/?error=server");
  }
}
