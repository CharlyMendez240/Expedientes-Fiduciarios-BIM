import { requestPasswordReset } from "@/lib/auth";
import { pgCode } from "@/lib/db";
import { postOriginAllowed, publicBase, redirectWithSession } from "@/lib/post-redirect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!postOriginAllowed(request, { requireOrigin: true })) {
    return redirectWithSession(request, "/restablecer?error=server");
  }
  try {
    const form = await request.formData();
    const email = String(form.get("email") || "");
    await requestPasswordReset(email, publicBase(request));
    return redirectWithSession(request, "/restablecer?enviado=1");
  } catch (error) {
    console.error("reset", pgCode(error) || "error");
    return redirectWithSession(request, "/restablecer?error=server");
  }
}
