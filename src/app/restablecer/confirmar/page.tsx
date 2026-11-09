import Link from "next/link";
import { BimLogo } from "@/components/BimLogo";
import { MIN_PASSWORD_LENGTH, passwordResetTarget } from "@/lib/auth";
import { ensureSeed } from "@/lib/db";

export default async function ConfirmResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  await ensureSeed();
  const params = await searchParams;
  const token = (params.token || "").trim();
  const email = token ? await passwordResetTarget(token) : null;

  return (
    <main className="hero-login">
      <section className="hero-panel" style={{ alignItems: "flex-start", justifyContent: "center" }}>
        <BimLogo variant="light" className="hero-logo-lg" />
        <h1 style={{ marginTop: "2rem" }}>Expedientes Digitales</h1>
      </section>
      <section className="login-panel">
        <h2 className="section-title">Nueva contraseña</h2>
        {email ? (
          <>
            <p className="muted" style={{ marginTop: 0 }}>
              Cuenta: <strong>{email}</strong>
            </p>
            {params.error === "debil" ? (
              <div className="error">La contraseña debe tener al menos {MIN_PASSWORD_LENGTH} caracteres.</div>
            ) : null}
            {params.error === "distinta" ? <div className="error">Las contraseñas no coinciden.</div> : null}
            {params.error === "server" ? (
              <div className="error">No se pudo guardar la contraseña. Intente de nuevo.</div>
            ) : null}
            <form action="/api/restablecer/confirmar" method="post" className="stack" style={{ marginTop: "1rem" }}>
              <input type="hidden" name="token" value={token} />
              <div>
                <label htmlFor="password">Nueva contraseña</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label htmlFor="confirm">Confirmar contraseña</label>
                <input
                  id="confirm"
                  name="confirm"
                  type="password"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  autoComplete="new-password"
                />
              </div>
              <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>
                Mínimo {MIN_PASSWORD_LENGTH} caracteres. Al guardarla, las sesiones anteriores se cierran.
              </p>
              <button className="btn btn-primary" type="submit">
                Guardar contraseña
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="error">El enlace no es válido o ya venció.</div>
            <p style={{ marginTop: "1rem" }}>
              <Link href="/restablecer">Pedir un enlace nuevo</Link>
            </p>
          </>
        )}
        <p style={{ marginTop: "1.25rem" }}>
          <Link href="/" className="muted">
            ← Volver al inicio
          </Link>
        </p>
      </section>
    </main>
  );
}
