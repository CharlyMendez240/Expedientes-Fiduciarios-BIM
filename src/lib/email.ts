export function buildClientInviteEmail(opts: {
  clienteNombre: string;
  negocioNombre: string;
  folio: string;
  accessPath: string;
}) {
  const subject = `Solicitud de documentación — ${opts.folio} · BIM Fiduciario`;
  const body_html = `
    <div style="font-family:Montserrat,Segoe UI,sans-serif;color:#1a2e30;line-height:1.5">
      <p>Estimado(a) <strong>${escapeHtml(opts.clienteNombre)}</strong>,</p>
      <p>
        Banco Inmobiliario Mexicano le solicita documentación para el negocio
        <strong>${escapeHtml(opts.negocioNombre)}</strong> (folio ${escapeHtml(opts.folio)}).
      </p>
      <p>Ingrese al portal con su correo. El código de acceso se muestra una sola vez al ejecutivo y no se guarda en este correo.</p>
      <p>
        <a href="${opts.accessPath}" style="display:inline-block;background:#009c3c;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:700">
          Abrir portal del cliente
        </a>
      </p>
      <p style="color:#5c7375;font-size:13px">Este mensaje es una simulación de correo para la demo. No se envió por SMTP real.</p>
    </div>
  `;
  return { subject, body_html };
}

export function buildPasswordResetEmail(link: string) {
  const safeLink = escapeHtml(link);
  const subject = "Restablecer contraseña — Expedientes Digitales";
  const body_html = `
    <div style="font-family:Montserrat,Segoe UI,sans-serif;color:#1a2e30;line-height:1.5">
      <p>Recibimos una solicitud para cambiar la contraseña de esta cuenta.</p>
      <p>El enlace vence en 30 minutos y solo puede usarse una vez.</p>
      <p>
        <a href="${safeLink}" style="display:inline-block;background:#009c3c;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:700">
          Elegir una contraseña nueva
        </a>
      </p>
      <p style="color:#5c7375;font-size:13px">Si usted no solicitó el cambio, ignore este mensaje.</p>
    </div>
  `;
  return { subject, body_html };
}

export const INVITE_CODE_COOKIE = "bim_invite_once";

export function readInviteCode(emailId: string, cookieValue: string | undefined): string {
  if (!cookieValue) return "";
  const splitAt = cookieValue.indexOf(".");
  if (splitAt <= 0) return "";
  if (cookieValue.slice(0, splitAt) !== emailId) return "";
  return cookieValue.slice(splitAt + 1);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
