import { sql } from "./db";

type Business = Record<string, unknown>;
type Participant = Record<string, unknown>;

function dig(obj: Record<string, unknown>, path: string): string {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return "";
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur == null ? "" : String(cur);
}

/** Resuelve campos parametrizados desde negocio, cliente y extracción documental. */
export async function resolveFormatFields(opts: {
  businessId: string;
  participantId?: string | null;
  fields: Array<{
    field_key: string;
    label: string;
    source_type: string;
    source_path: string;
    default_value: string;
  }>;
}): Promise<Array<{ field_key: string; label: string; value: string; source: string }>> {
  const businesses = await sql<Business>("select * from businesses where id = $1", [opts.businessId]);
  const business = businesses[0] || {};

  let participant: Participant = {};
  if (opts.participantId) {
    const rows = await sql<Participant>("select * from participants where id = $1", [
      opts.participantId,
    ]);
    participant = rows[0] || {};
  }

  const docs = await sql<{ doc_key: string; extracted: unknown }>(
    "select doc_key, extracted from business_documents where business_id = $1",
    [opts.businessId],
  );
  const byDoc: Record<string, Record<string, unknown>> = {};
  for (const d of docs) {
    const ex = typeof d.extracted === "string" ? JSON.parse(d.extracted) : d.extracted;
    byDoc[d.doc_key] = (ex && typeof ex === "object" ? ex : {}) as Record<string, unknown>;
  }

  return opts.fields.map((f) => {
    let value = f.default_value || "";
    let source = f.source_type;

    if (f.source_type === "manual_negocio") {
      value = dig(business, f.source_path) || value;
      source = `negocio.${f.source_path}`;
    } else if (f.source_type === "manual_cliente") {
      value = dig(participant, f.source_path) || value;
      source = `cliente.${f.source_path}`;
    } else if (f.source_type === "documento") {
      // path: docKey.field  e.g. ine.nombre
      const [docKey, ...rest] = f.source_path.split(".");
      const extracted = byDoc[docKey] || {};
      value = dig(extracted, rest.join(".")) || value;
      // fallback: search any doc for the leaf field
      if (!value && rest.length) {
        const leaf = rest[rest.length - 1];
        for (const ex of Object.values(byDoc)) {
          if (ex[leaf]) {
            value = String(ex[leaf]);
            break;
          }
        }
      }
      // fallback to participant field with same name
      if (!value && rest.length) {
        value = dig(participant, rest[rest.length - 1]) || value;
      }
      source = `documento.${f.source_path}`;
    } else if (f.source_type === "fijo") {
      if (f.source_path === "hoy") value = new Date().toISOString().slice(0, 10);
      else value = f.source_path || value;
      source = "fijo";
    }

    return { field_key: f.field_key, label: f.label, value, source };
  });
}
