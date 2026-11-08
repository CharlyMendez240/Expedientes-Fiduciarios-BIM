import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { StatusBadge } from "@/components/StatusBadge";
import {
  inviteClientAction,
  regenerateFormsAction,
  uploadBusinessDocumentAction,
} from "@/lib/actions";
import { canAccessBusiness, getSession } from "@/lib/auth";
import { ensureSeed, sql } from "@/lib/db";
import { CLIENT_REQUEST_TAB, clientRequestDocs, EXPEDIENTE_TABS } from "@/lib/expediente-tabs";

function parseDocs(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    try {
      const p = JSON.parse(value);
      return Array.isArray(p) ? p.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export default async function NegocioDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; invite_error?: string; forms?: string }>;
}) {
  await ensureSeed();
  const user = await getSession();
  if (!user || (user.role !== "ejecutivo" && user.role !== "superusuario")) redirect("/");
  const { id } = await params;
  const q = await searchParams;
  const activeTab = q.tab && EXPEDIENTE_TABS.some((t) => t.key === q.tab) ? q.tab : "1";

  const rows = await sql<Record<string, unknown>>("select * from businesses where id = $1", [id]);
  const business = rows[0];
  if (
    !business ||
    !(await canAccessBusiness(user, {
      ejecutivo_id: String(business.ejecutivo_id),
      region_id: (business.region_id as string) || null,
    }))
  ) {
    redirect("/ejecutivo");
  }

  const docs = await sql<{
    id: string;
    tab_key: string;
    doc_key: string;
    file_name: string;
    uploaded_by: string;
    request_id: string | null;
  }>(
    `select id, tab_key, doc_key, file_name, uploaded_by, request_id
     from business_documents where business_id = $1`,
    [id],
  );

  const invites = await sql<{
    id: string;
    cliente_nombre: string;
    cliente_email: string;
    status: string;
    auth_code: string | null;
    requested_docs: unknown;
  }>(
    `select id, cliente_nombre, cliente_email, status, auth_code, requested_docs
     from requests where business_id = $1 order by created_at desc`,
    [id],
  );

  const forms = await sql<{ id: string; title: string }>(
    "select id, title from generated_forms where business_id = $1 order by created_at",
    [id],
  );

  const tab = EXPEDIENTE_TABS.find((t) => t.key === activeTab)!;
  const catalog = clientRequestDocs();

  return (
    <div className="shell">
      <AppHeader user={user} crumb={String(business.folio)} />
      <main className="container fade-in">
        <div className="tabs">
          <Link className="tab" href="/ejecutivo">
            Negocios
          </Link>
          <span className="tab" aria-current="page">
            Expediente
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <h1 className="section-title">{String(business.nombre)}</h1>
            <p className="muted" style={{ marginTop: 0 }}>
              {String(business.folio)} · {String(business.tipo_contrato)} · multi-cliente
            </p>
          </div>
          <form action={regenerateFormsAction.bind(null, id)}>
            <button className="btn btn-accent" type="submit">
              Generar formatos (parametrizados)
            </button>
          </form>
        </div>

        {q.forms ? (
          <div className="flash" style={{ marginTop: "1rem" }}>
            Formatos generados con mapeo de campos.{" "}
            {forms.map((f) => (
              <a
                key={f.id}
                href={`/api/forms/${f.id}`}
                target="_blank"
                rel="noreferrer"
                style={{ marginRight: "0.75rem", textDecoration: "underline" }}
              >
                {f.title}
              </a>
            ))}
          </div>
        ) : null}

        <section className="panel" style={{ marginTop: "1rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.05rem", color: "var(--bim-brand)" }}>
            Solicitar documentación al cliente (pestaña 2)
          </h2>
          <p className="muted" style={{ margin: "0.35rem 0 0" }}>
            Solo se pide lo de Participantes. Defina nombre, correo y qué documentos solicitar. Puede
            haber varios clientes por negocio.
          </p>
          {q.invite_error ? (
            <div className="error" style={{ marginTop: "0.75rem" }}>
              Indique nombre, correo y al menos un documento de la pestaña 2.
            </div>
          ) : null}
          <form action={inviteClientAction.bind(null, id)} className="stack" style={{ marginTop: "0.85rem" }}>
            <div className="grid-2">
              <div>
                <label htmlFor="cliente_nombre">Nombre del cliente</label>
                <input id="cliente_nombre" name="cliente_nombre" required />
              </div>
              <div>
                <label htmlFor="cliente_email">Correo electrónico</label>
                <input id="cliente_email" name="cliente_email" type="email" required />
              </div>
            </div>
            <div>
              <label>Documentación a solicitar (pestaña 2 · Participantes)</label>
              <div className="check-grid" style={{ marginTop: "0.4rem" }}>
                {catalog.map((d) => (
                  <label key={d.key} className="check-item">
                    <input type="checkbox" name={`doc_${d.key}`} defaultChecked={!!d.required} />
                    <span>{d.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <button className="btn btn-primary" type="submit">
              Enviar solicitud por correo
            </button>
          </form>

          {invites.length ? (
            <table className="table" style={{ marginTop: "1rem" }}>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Correo</th>
                  <th>Docs solicitados</th>
                  <th>Estatus</th>
                  <th>Código</th>
                </tr>
              </thead>
              <tbody>
                {invites.map((inv) => (
                  <tr key={inv.id}>
                    <td>{inv.cliente_nombre}</td>
                    <td>{inv.cliente_email}</td>
                    <td style={{ fontSize: "0.82rem" }}>
                      {parseDocs(inv.requested_docs)
                        .map((k) => catalog.find((c) => c.key === k)?.label || k)
                        .join(", ") || "—"}
                    </td>
                    <td>
                      <StatusBadge status={inv.status} />
                    </td>
                    <td>
                      <code>{inv.auth_code || "—"}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </section>

        <div className="tabs" style={{ marginTop: "1.25rem" }}>
          {EXPEDIENTE_TABS.map((t) => {
            const count = docs.filter((d) => d.tab_key === t.key).length;
            return (
              <Link
                key={t.key}
                className="tab"
                href={`/ejecutivo/negocios/${id}?tab=${t.key}`}
                aria-current={activeTab === t.key ? "page" : undefined}
              >
                {t.title}
                {count ? ` · ${count}` : ""}
              </Link>
            );
          })}
        </div>

        <section className="panel">
          <h2 style={{ marginTop: 0, fontSize: "1.15rem", color: "var(--bim-brand)" }}>{tab.title}</h2>
          <p className="muted" style={{ marginTop: 0 }}>
            {tab.description}
            {activeTab === CLIENT_REQUEST_TAB
              ? " · También puede cargar aquí lo que el cliente aún no ha enviado."
              : ""}
          </p>
          <div className="stack" style={{ marginTop: "0.75rem" }}>
            {tab.documents.map((doc) => {
              const uploaded = docs.find((d) => d.tab_key === activeTab && d.doc_key === doc.key);
              return (
                <div key={doc.key} className="check-item" style={{ display: "block" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
                    <div>
                      <strong>
                        {doc.label}
                        {doc.required ? " *" : ""}
                      </strong>
                      <div className="muted" style={{ fontSize: "0.82rem" }}>
                        {uploaded
                          ? `${uploaded.file_name} · ${uploaded.uploaded_by}`
                          : "Pendiente"}
                      </div>
                    </div>
                    {uploaded ? (
                      <a className="btn btn-secondary" href={`/api/business-documents/${uploaded.id}`}>
                        Descargar
                      </a>
                    ) : null}
                  </div>
                  <form
                    action={uploadBusinessDocumentAction.bind(null, id)}
                    className="stack"
                    style={{ marginTop: "0.65rem" }}
                  >
                    <input type="hidden" name="tab_key" value={activeTab} />
                    <input type="hidden" name="doc_key" value={doc.key} />
                    <input type="file" name="file" required />
                    <button className="btn btn-secondary" type="submit">
                      {uploaded ? "Sustituir desde el ordenador" : "Cargar desde el ordenador"}
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
