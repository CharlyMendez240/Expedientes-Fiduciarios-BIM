import Link from "next/link";
import { BimLogo } from "@/components/BimLogo";
import { ensureSeed } from "@/lib/db";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ enviado?: string; error?: string }>;
}) {
  await ensureSeed();
  const params = await searchParams;

  return (
    <main className="hero-login">
      <section className="hero-panel" style={{ alignItems: "flex-start", justifyContent: "center" }}>
        <BimLogo variant="light" className="hero-logo-lg" />
        <h1 style={{ marginTop: "2rem" }}>Expedientes Digitales</h1>
      </section>
      <section className="login-panel">
        <h2 className="section-title">Restablecer contraseña</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Escriba el correo de la cuenta. Si está registrada, enviaremos un enlace para elegir la
          contraseña nueva.
        </p>
        {params.enviado ? (
          <div className="flash">Si el correo tiene una cuenta, recibirá el enlace en unos minutos.</div>
        ) : null}
        {params.error === "server" ? (
          <div className="error">No se pudo enviar el correo. Intente de nuevo.</div>
        ) : null}
        <form action="/api/restablecer" method="post" className="stack" style={{ marginTop: "1rem" }}>
          <div>
            <label htmlFor="email">Correo</label>
            <input id="email" name="email" type="email" required autoComplete="username" />
          </div>
          <button className="btn btn-primary" type="submit">
            Enviar enlace
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
