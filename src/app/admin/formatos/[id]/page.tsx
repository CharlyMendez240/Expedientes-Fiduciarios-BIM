import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { addFormatFieldAction, updateFormatFieldAction } from "@/lib/actions";
import { getSession } from "@/lib/auth";
import { ensureSeed, sql } from "@/lib/db";

export default async function AdminFormatoDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  await ensureSeed();
  const user = await getSession();
  if (!user || user.role !== "superusuario") redirect("/");
  const { id } = await params;
  const q = await searchParams;

  const templates = await sql<{ id: string; title: string; code: string; format_key: string }>(
    "select id, title, code, format_key from format_templates where id = $1",
    [id],
  );
  const tpl = templates[0];
  if (!tpl) redirect("/admin/formatos");

  const fields = await sql<{
    id: string;
    field_key: string;
    label: string;
    source_type: string;
    source_path: string;
    default_value: string;
  }>(
    `select id, field_key, label, source_type, source_path, default_value
     from format_fields where template_id = $1 order by sort_order, field_key`,
    [id],
  );

  return (
    <div className="shell">
      <AppHeader user={user} crumb={tpl.code} />
      <main className="container fade-in">
        <Link href="/admin/formatos" className="muted">
          ← Formatos
        </Link>
        <h1 className="section-title" style={{ marginTop: "0.75rem" }}>
          {tpl.title}
        </h1>
        <p className="muted">
          {tpl.format_key} · mapee cada campo a captura manual o a un dato extraído de documentos
          (ej. <code>ine.nombre</code>, <code>csf.rfc</code>).
        </p>
        {q.ok ? <div className="flash">Campo actualizado.</div> : null}

        <div className="stack" style={{ marginTop: "1rem" }}>
          {fields.map((f) => (
            <form key={f.id} action={updateFormatFieldAction} className="panel stack">
              <input type="hidden" name="field_id" value={f.id} />
              <input type="hidden" name="template_id" value={id} />
              <div className="grid-2">
                <div>
                  <label>Clave</label>
                  <input value={f.field_key} disabled />
                </div>
                <div>
                  <label>Etiqueta</label>
                  <input name="label" defaultValue={f.label} required />
                </div>
              </div>
              <div className="grid-2">
                <div>
                  <label>Origen</label>
                  <select name="source_type" defaultValue={f.source_type}>
                    <option value="manual_negocio">Captura manual · negocio</option>
                    <option value="manual_cliente">Captura manual · cliente</option>
                    <option value="documento">Documento / extracción</option>
                    <option value="fijo">Valor fijo</option>
                  </select>
                </div>
                <div>
                  <label>Ruta / campo</label>
                  <input
                    name="source_path"
                    defaultValue={f.source_path}
                    placeholder="folio | nombre | ine.curp | hoy"
                  />
                </div>
              </div>
              <div>
                <label>Valor por defecto</label>
                <input name="default_value" defaultValue={f.default_value} />
              </div>
              <button className="btn btn-secondary" type="submit">
                Guardar campo
              </button>
            </form>
          ))}
        </div>

        <section className="panel" style={{ marginTop: "1rem" }}>
          <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Agregar campo</h2>
          <form action={addFormatFieldAction} className="stack">
            <input type="hidden" name="template_id" value={id} />
            <div className="grid-2">
              <div>
                <label>Clave</label>
                <input name="field_key" required placeholder="nuevo_campo" />
              </div>
              <div>
                <label>Etiqueta</label>
                <input name="label" required />
              </div>
            </div>
            <div className="grid-2">
              <div>
                <label>Origen</label>
                <select name="source_type" defaultValue="documento">
                  <option value="manual_negocio">Captura manual · negocio</option>
                  <option value="manual_cliente">Captura manual · cliente</option>
                  <option value="documento">Documento / extracción</option>
                  <option value="fijo">Valor fijo</option>
                </select>
              </div>
              <div>
                <label>Ruta</label>
                <input name="source_path" placeholder="ine.nombre" />
              </div>
            </div>
            <button className="btn btn-primary" type="submit">
              Agregar
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
