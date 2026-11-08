import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { canAccessBusiness, getSession } from "@/lib/auth";
import { ensureSeed, sql } from "@/lib/db";

export default async function CorreoEnviadoPage({
  params,
}: {
  params: Promise<{ id: string; emailId: string }>;
}) {
  await ensureSeed();
  const user = await getSession();
  if (!user || (user.role !== "ejecutivo" && user.role !== "superusuario")) redirect("/");
  const { id, emailId } = await params;

  const businesses = await sql<{ ejecutivo_id: string; region_id: string | null }>(
    "select ejecutivo_id, region_id from businesses where id = $1",
    [id],
  );
  const business = businesses[0];
  if (!business || !(await canAccessBusiness(user, business))) {
    redirect("/ejecutivo");
  }

  const rows = await sql<{
    to_email: string;
    to_name: string;
    subject: string;
    body_html: string;
    auth_code: string;
    business_id: string;
  }>("select * from outbound_emails where id = $1", [emailId]);
  const mail = rows[0];
  if (!mail || mail.business_id !== id) redirect(`/ejecutivo/negocios/${id}`);

  return (
    <div className="shell">
      <AppHeader user={user} crumb="Correo simulado" />
      <main className="container fade-in">
        <Link href={`/ejecutivo/negocios/${id}?tab=1`} className="muted">
          ← Volver al expediente
        </Link>
        <h1 className="section-title" style={{ marginTop: "0.75rem" }}>
          Solicitud enviada
        </h1>
        <p className="muted">
          Demo: el correo no sale por SMTP; se muestra aquí como buzón simulado para el cliente{" "}
          <strong>{mail.to_name}</strong> ({mail.to_email}).
        </p>

        <div className="panel" style={{ marginTop: "1rem" }}>
          <div className="muted" style={{ fontSize: "0.82rem" }}>
            Para: {mail.to_email}
          </div>
          <h2 style={{ margin: "0.35rem 0 0.85rem", fontSize: "1.1rem" }}>{mail.subject}</h2>
          <div
            style={{ borderTop: "1px solid var(--line)", paddingTop: "0.85rem" }}
            dangerouslySetInnerHTML={{ __html: mail.body_html }}
          />
          <div className="flash" style={{ marginTop: "1rem" }}>
            Código de autenticación: <strong style={{ letterSpacing: "0.15em" }}>{mail.auth_code}</strong>
          </div>
          <p style={{ marginBottom: 0, marginTop: "1rem" }}>
            <Link className="btn btn-primary" href={`/cliente/acceso?email=${encodeURIComponent(mail.to_email)}`}>
              Probar acceso del cliente
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
