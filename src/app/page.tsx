import Link from "next/link";
import { redirect } from "next/navigation";
import { BimLogo } from "@/components/BimLogo";
import { loginAction } from "@/lib/actions";
import { getSession } from "@/lib/auth";
import { ensureSeed } from "@/lib/db";
import { DEMO_USERS, getLatestDemoEmail } from "@/lib/seed";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await ensureSeed();
  const user = await getSession();
  if (user?.role === "superusuario") redirect("/admin");
  if (user?.role === "ejecutivo") redirect("/ejecutivo");
  if (user?.role === "cliente") redirect("/cliente/carga");

  const params = await searchParams;
  const demoMail = await getLatestDemoEmail();

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

        {params.error ? (
          <div className="error">Credenciales incorrectas. Revise usuario y contraseña.</div>
        ) : null}

        <form action={loginAction} className="stack" style={{ marginTop: "1rem" }}>
          <div>
            <label htmlFor="email">Correo</label>
            <input id="email" name="email" type="email" defaultValue={DEMO_USERS[1].email} required />
          </div>
          <div>
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              defaultValue={DEMO_USERS[1].password}
              required
            />
          </div>
          <button className="btn btn-primary" type="submit">
            Entrar
          </button>
        </form>

        <div className="panel" style={{ marginTop: "1.25rem" }}>
          <strong style={{ color: "var(--bim-brand)" }}>Usuarios demo</strong>
          <ul className="muted" style={{ margin: "0.6rem 0 0.85rem", paddingLeft: "1.1rem", lineHeight: 1.55 }}>
            <li>
              Superusuario: <code>{DEMO_USERS[0].email}</code> / <code>{DEMO_USERS[0].password}</code>
            </li>
            <li>
              Ejecutivo Norte: <code>{DEMO_USERS[1].email}</code> / <code>{DEMO_USERS[1].password}</code>
            </li>
            <li>
              Ejecutivo Norte 2: <code>{DEMO_USERS[2].email}</code> / <code>{DEMO_USERS[2].password}</code>
            </li>
            <li>Cliente: correo + código (tras solicitud)</li>
          </ul>
          <Link className="btn btn-secondary" href="/cliente/acceso">
            Acceso cliente con código
          </Link>
          {demoMail ? (
            <p className="muted" style={{ marginBottom: 0, marginTop: "0.75rem", fontSize: "0.85rem" }}>
              Último correo: {demoMail.email} · <code>{demoMail.code}</code>
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
