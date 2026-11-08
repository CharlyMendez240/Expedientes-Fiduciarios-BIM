import Link from "next/link";
import { redirect } from "next/navigation";
import { BimLogo } from "@/components/BimLogo";
import { loginWithCodeAction } from "@/lib/actions";
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
              autoComplete="email"
              defaultValue={q.email || ""}
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
              autoComplete="one-time-code"
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
