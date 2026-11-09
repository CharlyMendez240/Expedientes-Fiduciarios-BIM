import Link from "next/link";
import { redirect } from "next/navigation";
import { BimLogo } from "@/components/BimLogo";
import { getSession } from "@/lib/auth";
import { ensureSeed } from "@/lib/db";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; code?: string; listo?: string }>;
}) {
  await ensureSeed();
  const user = await getSession();
  if (user?.role === "superusuario") redirect("/admin");
  if (user?.role === "ejecutivo") redirect("/ejecutivo");
  if (user?.role === "cliente") redirect("/cliente/carga");

  const params = await searchParams;

  return (
    <main className="hero-login">
      <section className="hero-panel" style={{ alignItems: "flex-start", justifyContent: "center" }}>
        <BimLogo variant="light" className="hero-logo-lg" />
        <h1 style={{ marginTop: "2rem" }}>Expedientes Digitales</h1>
      </section>

      <section className="login-panel">
        <h2 className="section-title">Acceso</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Ejecutivo / superusuario con usuario y contraseña. Cliente con código del correo.
        </p>

        {params.error === "locked" ? (
          <div className="error">Demasiados intentos. Espere 15 minutos e intente de nuevo.</div>
        ) : params.error === "server" ? (
          <div className="error">
            No se pudo iniciar sesión por un error del servidor. Intente de nuevo.
            {/^[0-9A-Z]{5}$/.test(params.code || "") ? ` (${params.code})` : ""}
          </div>
        ) : params.error ? (
          <div className="error">Credenciales incorrectas. Revise usuario y contraseña.</div>
        ) : params.listo ? (
          <div className="flash">Contraseña actualizada. Ya puede entrar con la nueva.</div>
        ) : null}

        <form action="/api/login" method="post" className="stack" style={{ marginTop: "1rem" }}>
          <div>
            <label htmlFor="email">Correo</label>
            <input id="email" name="email" type="email" required autoComplete="username" />
          </div>
          <div>
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </div>
          <button className="btn btn-primary" type="submit">
            Entrar
          </button>
        </form>

        <p style={{ marginTop: "1rem" }}>
          <Link href="/restablecer">Restablecer contraseña</Link>
        </p>
        <p className="muted" style={{ marginTop: "1.25rem", fontSize: "0.9rem" }}>
          El cliente entra con el código del correo. El ejecutivo puede definir una contraseña nueva.
        </p>
        <p style={{ marginTop: "0.75rem" }}>
          <Link className="btn btn-secondary" href="/cliente/acceso">
            Acceso cliente con código
          </Link>
        </p>
      </section>
    </main>
  );
}
