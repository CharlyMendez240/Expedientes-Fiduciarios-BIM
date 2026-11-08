import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { uploadBusinessDocumentAction, validateClientDocsAction } from "@/lib/actions";
import { getSession } from "@/lib/auth";
import { ensureSeed, sql } from "@/lib/db";
import { CLIENT_REQUEST_TAB, clientRequestDocs } from "@/lib/expediente-tabs";

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

export default async function ClienteCargaPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; upload_error?: string }>;
}) {
  await ensureSeed();
  const user = await getSession();
  if (!user || user.role !== "cliente") redirect("/cliente/acceso");
  const q = await searchParams;

  const requests = await sql<{
    id: string;
    business_id: string;
    status: string;
    cliente_nombre: string;
    requested_docs: unknown;
    negocio: string;
    folio: string;
  }>(
    `select r.id, r.business_id, r.status, r.cliente_nombre, r.requested_docs,
            b.nombre as negocio, b.folio
     from requests r
     join businesses b on b.id = r.business_id
     where r.cliente_user_id = $1
     order by r.created_at desc
     limit 1`,
    [user.id],
  );
  const req = requests[0];
  if (!req) redirect("/cliente/acceso");

  const requested = parseDocs(req.requested_docs);
  const catalog = clientRequestDocs().filter((d) => requested.includes(d.key));
  const docs = await sql<{
    id: string;
    doc_key: string;
    file_name: string;
  }>(
    `select id, doc_key, file_name from business_documents
     where business_id = $1 and tab_key = $2 and request_id = $3`,
    [req.business_id, CLIENT_REQUEST_TAB, req.id],
  );

  return (
    <div className="shell">
      <AppHeader user={user} crumb="Carga documental · pestaña 2" />
      <main className="container fade-in">
        {q.ok ? (
          <div className="flash" style={{ marginBottom: "1rem" }}>
            Documentación confirmada. Gracias.
          </div>
        ) : null}
        {q.upload_error ? (
          <div className="error" style={{ marginBottom: "1rem" }}>
            El archivo supera 8 MB y no se guardó.
          </div>
        ) : null}

        <h1 className="section-title">{req.negocio}</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          Folio {req.folio} · {req.cliente_nombre} · <StatusBadge status={req.status} />
        </p>
        <p className="muted">
          Solo debe cargar los documentos que el ejecutivo solicitó de la pestaña 2 (Participantes).
        </p>

        <section className="panel" style={{ marginTop: "1rem" }}>
          <div className="stack">
            {catalog.map((doc) => {
              const uploaded = docs.find((d) => d.doc_key === doc.key);
              return (
                <div key={doc.key} className="check-item" style={{ display: "block" }}>
                  <strong>{doc.label}</strong>
                  <div className="muted" style={{ fontSize: "0.82rem" }}>
                    {uploaded ? uploaded.file_name : "Pendiente"}
                  </div>
                  {uploaded ? (
                    <a className="btn btn-secondary" href={`/api/business-documents/${uploaded.id}`}>
                      Ver o descargar
                    </a>
                  ) : null}
                  <form
                    action={uploadBusinessDocumentAction.bind(null, req.business_id)}
                    className="stack"
                    style={{ marginTop: "0.55rem" }}
                  >
                    <input type="hidden" name="tab_key" value={CLIENT_REQUEST_TAB} />
                    <input type="hidden" name="doc_key" value={doc.key} />
                    <input type="hidden" name="request_id" value={req.id} />
                    <input type="file" name="file" required />
                    <button className="btn btn-secondary" type="submit">
                      {uploaded ? "Sustituir archivo" : "Cargar desde el ordenador"}
                    </button>
                  </form>
                </div>
              );
            })}
            {!catalog.length ? (
              <p className="muted">No hay documentos solicitados en esta invitación.</p>
            ) : null}
          </div>
        </section>

        <form action={validateClientDocsAction} style={{ marginTop: "1rem" }}>
          <button className="btn btn-primary" type="submit">
            Confirmar documentación completa
          </button>
        </form>
      </main>
    </div>
  );
}
