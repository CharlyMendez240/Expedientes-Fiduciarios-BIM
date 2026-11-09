import Link from "next/link";
import { redirect } from "next/navigation";
import { BimLogo } from "@/components/BimLogo";
import { getSession } from "@/lib/auth";
import { ensureSeed } from "@/lib/db";

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

  return (
    <main className="hero-login">
      <section className="hero-panel">
        <BimLogo variant="light" />
        <h1>Portal del cliente</h1>
        <p>
          Ingrese con el correo de la solicitud y el código de un solo uso del correo simulado.
        </p>
      </section>
      <section className="login-panel">
        <h2 className="section-title">Acceso con código</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          El código llega en el correo de solicitud documental (simulado en esta demo).
        </p>
        {q.error === "locked" ? (
          <div className="error">Demasiados intentos. Espere 15 minutos y pida un código nuevo.</div>
        ) : q.error === "server" ? (
          <div className="error">No se pudo iniciar sesión por un error del servidor. Intente de nuevo.</div>
        ) : q.error ? (
          <div className="error">Correo o código incorrectos, o el código expiró.</div>
        ) : null}
        <form action="/api/login/codigo" method="post" className="stack" style={{ marginTop: "1rem" }}>
          <div>
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue={q.email || ""}
            />
          </div>
          <div>
            <label htmlFor="auth_code">Código de autenticación</label>
            <input
              id="auth_code"
              name="auth_code"
              required
              minLength={20}
              maxLength={128}
              autoComplete="one-time-code"
              spellCheck={false}
            />
          </div>
          <button className="btn btn-primary" type="submit">
            Entrar al portal
          </button>
        </form>
        <p style={{ marginTop: "1.25rem" }}>
          <Link href="/" className="muted">
            ← Volver al inicio
          </Link>
        </p>
      </section>
    </main>
  );
}
