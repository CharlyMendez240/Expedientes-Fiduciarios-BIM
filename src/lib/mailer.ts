import { buildPasswordResetEmail } from "./email";

export async function sendPasswordResetEmail(to: string, link: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY?.trim() ?? "";
  const from = process.env.BIM_MAIL_FROM?.trim() ?? "";
  if (!key || !from) return false;
  const message = buildPasswordResetEmail(link);
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: message.subject,
        html: message.body_html,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) console.error("mail", response.status);
    return response.ok;
  } catch {
    console.error("mail", "error");
    return false;
  }
}
