import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { getSession } from "@/lib/auth";
import { ensureSeed, sql } from "@/lib/db";

export default async function AdminHome() {
  await ensureSeed();
  const user = await getSession();
  if (!user || user.role !== "superusuario") redirect("/");

  const counts = await sql<{ users: string; regions: string; formats: string }>(
    `select
      (select count(*)::text from users) as users,
      (select count(*)::text from regions) as regions,
      (select count(*)::text from format_templates) as formats`,
  );

  return (
    <div className="shell">
      <AppHeader user={user} crumb="Administración" />
      <main className="container fade-in">
        <h1 className="section-title">Superusuario</h1>
        <p className="muted">Alta de usuarios, regiones y parametrización de formatos.</p>
        <div className="kpi-row" style={{ marginTop: "1.25rem" }}>
          <div className="kpi">
            <span className="muted">Usuarios</span>
            <strong>{counts[0]?.users || "0"}</strong>
          </div>
          <div className="kpi">
            <span className="muted">Regiones</span>
            <strong>{counts[0]?.regions || "0"}</strong>
          </div>
          <div className="kpi">
            <span className="muted">Formatos</span>
            <strong>{counts[0]?.formats || "0"}</strong>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
          <Link className="btn btn-primary" href="/admin/usuarios">
            Gestionar usuarios y regiones
          </Link>
          <Link className="btn btn-secondary" href="/admin/formatos">
            Parametrizar formatos
          </Link>
          <Link className="btn btn-secondary" href="/ejecutivo">
            Ver negocios
          </Link>
        </div>
      </main>
    </div>
  );
}
