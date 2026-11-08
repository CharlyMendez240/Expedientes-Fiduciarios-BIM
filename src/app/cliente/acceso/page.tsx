import Link from "next/link";
import { redirect } from "next/navigation";
import { BimLogo } from "@/components/BimLogo";
import { loginWithCodeAction } from "@/lib/actions";
import { getSession } from "@/lib/auth";
import { ensureSeed, sql } from "@/lib/db";

export default async function ClienteAccesoPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string }>;
}) {
  await ensureSeed();
  const user = await getSession();
  if (user?.role === "cliente") redirect("/cliente/carga");
  if (user?.role === "ejecutivo") redirect("/ejecutivo");

  const q = await searchParams;
  const latest = await sql<{ to_email: string; auth_code: string; to_name: string }>(
    "select to_email, auth_code, to_name from outbound_emails order by created_at desc limit 1",
  );

  return (
    <main className="hero-login">
      <section className="hero-panel">
        <BimLogo variant="light" />
        <h1>Portal del cliente</h1>
        <p>
          Ingrese con el correo donde recibió la solicitud y el código de autenticación de 6 dígitos.
        </p>
      </section>
      <section className="login-panel">
        <h2 className="section-title">Acceso con código</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          El código llega en el correo de solicitud documental (simulado en esta demo).
        </p>
        {q.error ? (
          <div className="error">Correo o código incorrectos, o el código expiró.</div>
        ) : null}
        <form action={loginWithCodeAction} className="stack" style={{ marginTop: "1rem" }}>
          <div>
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={q.email || latest[0]?.to_email || ""}
            />
          </div>
          <div>
            <label htmlFor="auth_code">Código de autenticación</label>
            <input
              id="auth_code"
              name="auth_code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              placeholder="000000"
              defaultValue={latest[0]?.auth_code || ""}
            />
          </div>
          <button className="btn btn-primary" type="submit">
            Entrar al portal
          </button>
        </form>
        {latest[0] ? (
          <div className="panel" style={{ marginTop: "1.25rem" }}>
            <strong style={{ color: "var(--bim-brand)" }}>Último correo demo</strong>
            <p className="muted" style={{ marginBottom: 0 }}>
              {latest[0].to_name} · {latest[0].to_email} · código{" "}
              <code>{latest[0].auth_code}</code>
            </p>
          </div>
        ) : null}
        <p style={{ marginTop: "1.25rem" }}>
          <Link href="/" className="muted">
            ← Volver al inicio
          </Link>
        </p>
      </section>
    </main>
  );
}
