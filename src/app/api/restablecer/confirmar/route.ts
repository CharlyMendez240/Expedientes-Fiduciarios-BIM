import { completePasswordReset } from "@/lib/auth";
import { pgCode } from "@/lib/db";
import { postOriginAllowed, redirectWithSession } from "@/lib/post-redirect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeToken(value: string): string {
  const token = value.trim();
  if (!/^[A-Za-z0-9_-]{20,200}$/.test(token)) return "";
  return token;
}

export async function POST(request: Request) {
  if (!postOriginAllowed(request, { requireOrigin: true })) {
    return redirectWithSession(request, "/restablecer?error=server");
  }
  let token = "";
  try {
    const form = await request.formData();
    token = safeToken(String(form.get("token") || ""));
    const password = String(form.get("password") || "");
    const confirm = String(form.get("confirm") || "");
    const result = await completePasswordReset(token, password, confirm);
    if (result === "ok") return redirectWithSession(request, "/?listo=1", undefined, true);
    if (result === "invalid" || !token) return redirectWithSession(request, "/restablecer/confirmar");
    const error = result === "weak" ? "debil" : "distinta";
    return redirectWithSession(
      request,
      `/restablecer/confirmar?token=${encodeURIComponent(token)}&error=${error}`,
    );
  } catch (error) {
    console.error("reset", pgCode(error) || "error");
    const back = token
      ? `/restablecer/confirmar?token=${encodeURIComponent(token)}&error=server`
      : "/restablecer?error=server";
    return redirectWithSession(request, back);
  }
}
