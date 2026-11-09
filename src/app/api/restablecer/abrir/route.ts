import { RESET_COOKIE, passwordResetTarget, resetCookieOptions, safeResetToken } from "@/lib/auth";
import { redirectWithSession } from "@/lib/post-redirect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = safeResetToken(new URL(request.url).searchParams.get("token") || "");
  const response = redirectWithSession(request, "/restablecer/confirmar");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("Cache-Control", "no-store");
  const options = resetCookieOptions();
  if (token && (await passwordResetTarget(token))) {
    response.cookies.set(RESET_COOKIE, token, options);
  } else {
    response.cookies.set(RESET_COOKIE, "", { ...options, maxAge: 0 });
  }
  return response;
}
