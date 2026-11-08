import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { getSession } from "@/lib/auth";
import { ensureSeed, sql } from "@/lib/db";

export default async function EjecutivoHome() {
  await ensureSeed();
  const user = await getSession();
  if (!user || (user.role !== "ejecutivo" && user.role !== "superusuario")) redirect("/");

  const businesses = await sql<{
    id: string;
    folio: string;
    nombre: string;
    tipo_contrato: string;
    status: string;
    region_name: string | null;
    ejecutivo_nombre: string;
    clientes: string;
  }>(
    `select b.id, b.folio, b.nombre, b.tipo_contrato, b.status,
            r.name as region_name, u.name as ejecutivo_nombre,
            count(distinct req.id)::text as clientes
     from businesses b
     left join regions r on r.id = b.region_id
     left join users u on u.id = b.ejecutivo_id
     left join requests req on req.business_id = b.id
     where (
       $1 = 'superusuario'
       or b.ejecutivo_id = $2
       or (b.region_id is not null and b.region_id = $3)
     )
     group by b.id, r.name, u.name
     order by b.created_at desc`,
    [user.role, user.id, user.region_id],
  );

  return (
    <div className="shell">
      <AppHeader user={user} crumb="Escritorio fiduciario" />
      <main className="container fade-in">
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <h1 className="section-title">Negocios</h1>
            <p className="muted" style={{ marginTop: 0 }}>
              Los ejecutivos de la misma región pueden atender las mismas solicitudes.
            </p>
          </div>
          <Link href="/ejecutivo/negocios/nuevo" className="btn btn-primary">
            Registrar negocio
          </Link>
        </div>

        <div className="panel" style={{ marginTop: "1.25rem" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Folio</th>
                <th>Negocio</th>
                <th>Región</th>
                <th>Ejecutivo titular</th>
                <th>Clientes</th>
                <th>Estatus</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {businesses.map((b) => (
                <tr key={b.id}>
                  <td>{b.folio}</td>
                  <td>
                    <strong>{b.nombre}</strong>
                    <div className="muted" style={{ fontSize: "0.8rem" }}>
                      {b.tipo_contrato}
                    </div>
                  </td>
                  <td>{b.region_name || "—"}</td>
                  <td>{b.ejecutivo_nombre}</td>
                  <td>{b.clientes}</td>
                  <td>
                    <StatusBadge status={b.status} />
                  </td>
                  <td>
                    <Link href={`/ejecutivo/negocios/${b.id}?tab=1`} className="btn btn-secondary">
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}
              {!businesses.length ? (
                <tr>
                  <td colSpan={7} className="muted">
                    No hay negocios en su región. Registre el primero.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
