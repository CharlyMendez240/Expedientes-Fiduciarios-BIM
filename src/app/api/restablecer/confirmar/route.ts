import { RESET_COOKIE, completePasswordReset, resetCookieOptions, safeResetToken } from "@/lib/auth";
import { pgCode } from "@/lib/db";
import { postOriginAllowed, redirectWithSession } from "@/lib/post-redirect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resetToken(request: Request): string {
  const header = request.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    if (trimmed.slice(0, eq) !== RESET_COOKIE) continue;
    try {
      return safeResetToken(decodeURIComponent(trimmed.slice(eq + 1)));
    } catch {
      return "";
    }
  }
  return "";
}

export async function POST(request: Request) {
  if (!postOriginAllowed(request, { requireOrigin: true })) {
    return redirectWithSession(request, "/restablecer?error=server");
  }
  const token = resetToken(request);
  try {
    const form = await request.formData();
    const password = String(form.get("password") || "");
    const confirm = String(form.get("confirm") || "");
    const result = await completePasswordReset(token, password, confirm);
    if (result === "ok") {
      const response = redirectWithSession(request, "/?listo=1", undefined, true);
      response.cookies.set(RESET_COOKIE, "", { ...resetCookieOptions(), maxAge: 0 });
      return response;
    }
    if (result === "invalid" || !token) {
      const response = redirectWithSession(request, "/restablecer/confirmar");
      response.cookies.set(RESET_COOKIE, "", { ...resetCookieOptions(), maxAge: 0 });
      return response;
    }
    const error = result === "weak" ? "debil" : "distinta";
    return redirectWithSession(request, `/restablecer/confirmar?error=${error}`);
  } catch (error) {
    console.error("reset", pgCode(error) || "error");
    return redirectWithSession(request, "/restablecer/confirmar?error=server");
  }
}
