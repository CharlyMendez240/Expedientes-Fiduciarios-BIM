import Link from "next/link";
import { BimLogo } from "@/components/BimLogo";
import { lookupPasswordAccount, MIN_PASSWORD_LENGTH } from "@/lib/auth";
import { ensureSeed } from "@/lib/db";

function safeEmail(value: string | undefined): string {
  const email = (value || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+$/.test(email) || email.length > 200) return "";
  return email;
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ correo?: string; error?: string; code?: string }>;
}) {
  await ensureSeed();
  const params = await searchParams;
  const requested = safeEmail(params.correo);
  const account = requested ? await lookupPasswordAccount(requested) : null;
  const staffEmail = account?.status === "staff" ? account.email : "";

  return (
    <main className="hero-login">
      <section className="hero-panel" style={{ alignItems: "flex-start", justifyContent: "center" }}>
        <BimLogo variant="light" className="hero-logo-lg" />
        <h1 style={{ marginTop: "2rem" }}>Expedientes Digitales</h1>
      </section>
      <section className="login-panel">
        <h2 className="section-title">Restablecer contraseña</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Entorno de preproducción: si el correo es de un ejecutivo o del superusuario, puede definir
          la contraseña nueva en este momento.
        </p>
        <ResetMessage error={staffEmail && params.error === "1" ? undefined : params.error} code={params.code} />
        {staffEmail ? (
          <form action="/api/restablecer" method="post" className="stack" style={{ marginTop: "1rem" }}>
            <p>
              Cuenta: <strong>{staffEmail}</strong>
            </p>
            <input type="hidden" name="email" value={staffEmail} />
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
        ) : (
          <form action="/api/restablecer" method="post" className="stack" style={{ marginTop: "1rem" }}>
            <div>
              <label htmlFor="email">Correo</label>
              <input id="email" name="email" type="email" required autoComplete="username" />
            </div>
            <button className="btn btn-primary" type="submit">
              Continuar
            </button>
          </form>
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

function ResetMessage({ error, code }: { error?: string; code?: string }) {
  if (error === "locked") {
    return <div className="error">Demasiados intentos. Espere 15 minutos e intente de nuevo.</div>;
  }
  if (error === "cliente") {
    return <div className="error">Ese correo entra con el código de un solo uso, no con contraseña.</div>;
  }
  if (error === "debil") {
    return <div className="error">La contraseña debe tener al menos {MIN_PASSWORD_LENGTH} caracteres.</div>;
  }
  if (error === "distinta") {
    return <div className="error">Las contraseñas no coinciden.</div>;
  }
  if (error === "server") {
    return (
      <div className="error">
        No se pudo actualizar la contraseña. Intente de nuevo.
        {/^[0-9A-Z]{5}$/.test(code || "") ? ` (${code})` : ""}
      </div>
    );
  }
  if (error) {
    return <div className="error">No hay una cuenta de ejecutivo o superusuario con ese correo.</div>;
  }
  return null;
}
