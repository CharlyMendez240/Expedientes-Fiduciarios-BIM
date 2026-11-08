import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { getSession } from "@/lib/auth";
import { ensureSeed, sql } from "@/lib/db";

export default async function AdminFormatosPage() {
  await ensureSeed();
  const user = await getSession();
  if (!user || user.role !== "superusuario") redirect("/");

  const templates = await sql<{
    id: string;
    format_key: string;
    title: string;
    code: string;
    campos: string;
  }>(
    `select t.id, t.format_key, t.title, t.code, count(f.id)::text as campos
     from format_templates t
     left join format_fields f on f.template_id = t.id
     group by t.id
     order by t.title`,
  );

  return (
    <div className="shell">
      <AppHeader user={user} crumb="Parametrización de formatos" />
      <main className="container fade-in">
        <h1 className="section-title">Formatos</h1>
        <p className="muted">
          Defina de dónde sale cada campo: captura manual del ejecutivo/cliente o extracción de
          documentos.
        </p>
        <div className="panel" style={{ marginTop: "1rem" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Formato</th>
                <th>Código</th>
                <th>Campos</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.id}>
                  <td>
                    <strong>{t.title}</strong>
                    <div className="muted" style={{ fontSize: "0.8rem" }}>
                      {t.format_key}
                    </div>
                  </td>
                  <td>{t.code}</td>
                  <td>{t.campos}</td>
                  <td>
                    <Link className="btn btn-secondary" href={`/admin/formatos/${t.id}`}>
                      Parametrizar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
