import { formatByKey } from "./formats";

type Business = {
  folio: string;
  nombre: string;
  tipo_contrato: string;
  credito_bim: boolean;
  descripcion: string;
  patrimonio_tipo: string;
  patrimonio_valor: string;
  patrimonio_desc: string;
  honorarios_aceptacion: string;
  honorarios_admin: string;
  fines: string;
};

type Participant = {
  nombre: string;
  tipo_persona: string;
  nacionalidad: string;
  rol_negocio: string;
  rfc: string;
  curp: string;
  email: string;
  telefono: string;
  domicilio: string;
  fecha_nacimiento: string;
  nacionalidad_pais: string;
  actividad_economica: string;
};

type Extracted = Record<string, string>;

function esc(v: string | number | boolean | null | undefined): string {
  return String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function field(label: string, value: string, source: string) {
  return `<tr>
    <th>${esc(label)}</th>
    <td><input value="${esc(value)}" /></td>
    <td class="src">${esc(source)}</td>
  </tr>`;
}

function shell(title: string, code: string, body: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>${esc(title)}</title>
<style>
  :root { --ink:#13233a; --line:#c9d2de; --muted:#5b6b7c; --paper:#fbfcfe; --brand:#0b3d4a; }
  body { font-family: "Segoe UI", system-ui, sans-serif; color: var(--ink); background: #e8eef2; margin: 0; padding: 24px; }
  .sheet { max-width: 920px; margin: 0 auto; background: var(--paper); border: 1px solid var(--line); padding: 28px 32px; }
  header { border-bottom: 2px solid var(--brand); padding-bottom: 12px; margin-bottom: 18px; }
  .brand { font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: var(--brand); font-weight: 700; }
  h1 { font-size: 22px; margin: 6px 0 4px; }
  .code { color: var(--muted); font-size: 13px; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th, td { border: 1px solid var(--line); padding: 8px 10px; vertical-align: top; font-size: 13px; }
  th { width: 32%; background: #f0f4f7; text-align: left; font-weight: 600; }
  input { width: 100%; border: 0; background: transparent; font: inherit; color: inherit; }
  .src { width: 22%; color: var(--muted); font-size: 11px; }
  .note { margin-top: 16px; font-size: 12px; color: var(--muted); }
  h2 { font-size: 15px; margin: 22px 0 8px; color: var(--brand); }
</style>
</head>
<body>
  <article class="sheet">
    <header>
      <div class="brand">Banco Inmobiliario Mexicano · Fiduciario</div>
      <h1>${esc(title)}</h1>
      <div class="code">${esc(code)} · Prefill demo editable</div>
    </header>
    ${body}
    <p class="note">Los valores provienen de captura manual del ejecutivo y/o extracción mock de documentos. Revise y edite antes de firma. Demo sin escritura al core bancario.</p>
  </article>
</body>
</html>`;
}

function mergeExtracted(p: Participant, extracted: Extracted): Participant & Extracted {
  return {
    ...p,
    nombre: extracted.nombre || p.nombre,
    rfc: extracted.rfc || p.rfc,
    curp: extracted.curp || p.curp,
    fecha_nacimiento: extracted.fecha_nacimiento || p.fecha_nacimiento,
    domicilio: extracted.domicilio || p.domicilio,
    ...extracted,
  };
}

export function generateFormHtml(opts: {
  formatKey: string;
  business: Business;
  participant?: Participant | null;
  ejecutivoName: string;
  extracted?: Extracted;
}): { title: string; html: string; sourceTrace: Record<string, string> } {
  const def = formatByKey(opts.formatKey);
  const title = def?.title || opts.formatKey;
  const code = def?.code || "";
  const p = opts.participant
    ? mergeExtracted(opts.participant, opts.extracted || {})
    : null;
  const sourceTrace: Record<string, string> = {};
  const src = (fieldName: string, from: string) => {
    sourceTrace[fieldName] = from;
    return from;
  };

  if (opts.formatKey === "alta_checklist") {
    const body = `
      <h2>Datos generales del negocio</h2>
      <table>
        ${field("No. / folio fideicomiso", opts.business.folio, src("folio", "captura ejecutivo"))}
        ${field("Nombre del fideicomiso", opts.business.nombre, src("nombre", "captura ejecutivo"))}
        ${field("Tipo de contrato", opts.business.tipo_contrato, src("tipo", "captura ejecutivo"))}
        ${field("Crédito BIM", opts.business.credito_bim ? "Sí" : "No", src("credito", "captura ejecutivo"))}
        ${field("Responsable fiduciario", opts.ejecutivoName, src("ejecutivo", "sesión"))}
        ${field("Participante principal", p?.nombre || "—", src("participante", p ? "participante" : "n/a"))}
      </table>
      <h2>Lista de comprobación (resumen)</h2>
      <table>
        ${field("Identificación oficial", "Pendiente de cotejo Mesa de Control", "checklist")}
        ${field("CSF ≤ 3 meses", "Pendiente de cotejo", "checklist")}
        ${field("Comprobante domicilio ≤ 3 meses", "Pendiente de cotejo", "checklist")}
        ${field("Carátula OFID", "Incluida en formatos seleccionados", "formatos")}
      </table>`;
    return { title, html: shell(title, code, body), sourceTrace };
  }

  if (opts.formatKey === "caratula_ofid") {
    const body = `
      <h2>Negocio</h2>
      <table>
        ${field("Folio", opts.business.folio, src("folio", "captura ejecutivo"))}
        ${field("Nombre", opts.business.nombre, src("nombre", "captura ejecutivo"))}
        ${field("Tipo de negocio", opts.business.tipo_contrato, src("tipo", "captura ejecutivo"))}
        ${field("Fines", opts.business.fines, src("fines", "captura ejecutivo"))}
        ${field("Tipo de riesgo", "Medio (demo)", "default demo")}
      </table>
      <h2>Participante</h2>
      <table>
        ${field("Nombre / razón social", p?.nombre || "—", src("p_nombre", "participante"))}
        ${field("Actividad económica", p?.actividad_economica || "—", src("actividad", "participante"))}
        ${field("Rol", p?.rol_negocio || "—", src("rol", "participante"))}
      </table>
      <h2>Patrimonio y honorarios</h2>
      <table>
        ${field("Tipo patrimonio", opts.business.patrimonio_tipo, src("pat_tipo", "captura ejecutivo"))}
        ${field("Valor", opts.business.patrimonio_valor, src("pat_val", "captura ejecutivo"))}
        ${field("Descripción", opts.business.patrimonio_desc, src("pat_desc", "captura ejecutivo"))}
        ${field("Honorarios aceptación", opts.business.honorarios_aceptacion, src("hon_a", "captura ejecutivo"))}
        ${field("Honorarios administración", opts.business.honorarios_admin, src("hon_b", "captura ejecutivo"))}
      </table>
      <h2>Resolución OFID</h2>
      <table>
        ${field("Estatus", "Pendiente de sesión OFID", "flujo")}
        ${field("Certificación KYC / listas", "Listas negras: próximamente / sin proveedor", "placeholder")}
      </table>`;
    return { title, html: shell(title, code, body), sourceTrace };
  }

  if (!p) {
    return {
      title,
      html: shell(title, code, "<p>Sin participante asociado.</p>"),
      sourceTrace,
    };
  }

  if (opts.formatKey.startsWith("kyc")) {
    const body = `
      <h2>I. Identificación</h2>
      <table>
        ${field("Nombre / razón social", p.nombre, src("nombre", opts.extracted?.nombre ? "extraído editable" : "participante"))}
        ${field("RFC", p.rfc, src("rfc", "participante"))}
        ${field("CURP / equivalente", p.curp, src("curp", "participante"))}
        ${field("Nacionalidad", `${p.nacionalidad} · ${p.nacionalidad_pais}`, src("nac", "participante"))}
        ${field("Fecha de nacimiento / constitución", p.fecha_nacimiento, src("fnac", "participante"))}
        ${field("Domicilio", p.domicilio, src("dom", "participante"))}
        ${field("Teléfono", p.telefono, src("tel", "participante"))}
        ${field("Correo", p.email, src("email", "participante"))}
        ${field("Rol en el negocio", p.rol_negocio, src("rol", "participante"))}
        ${field("Actividad económica", p.actividad_economica, src("act", "participante"))}
      </table>
      <h2>II. PEP</h2>
      <table>
        ${field("¿Es PEP o asimilado?", "No (declaración demo)", "default demo")}
      </table>
      <h2>III. Fideicomiso</h2>
      <table>
        ${field("Negocio", `${opts.business.folio} — ${opts.business.nombre}`, src("neg", "negocio"))}
        ${field("Fines", opts.business.fines, src("fines", "negocio"))}
        ${field("Patrimonio", `${opts.business.patrimonio_tipo} · ${opts.business.patrimonio_valor}`, src("pat", "negocio"))}
      </table>
      <h2>Ejecutivo BIM</h2>
      <table>
        ${field("Ejecutivo que elabora", opts.ejecutivoName, src("ej", "sesión"))}
      </table>`;
    return { title, html: shell(title, code, body), sourceTrace };
  }

  if (opts.formatKey.startsWith("bc_")) {
    const body = `
      <h2>Identificación del beneficiario controlador</h2>
      <table>
        ${field("Nombre / razón social", p.nombre, src("nombre", "participante"))}
        ${field("Fecha desde la que es BC", "Alta del negocio (demo)", "default demo")}
        ${field("País de nacionalidad", p.nacionalidad_pais, src("pais", "participante"))}
        ${field("RFC / NIF", p.rfc, src("rfc", "participante"))}
        ${field("CURP / equivalente", p.curp, src("curp", "participante"))}
        ${field("Domicilio particular / fiscal", p.domicilio, src("dom", "participante"))}
        ${field("Contacto", `${p.email} · ${p.telefono}`, src("contacto", "participante"))}
      </table>
      <p class="note">Formato CFF 32-B Ter/Quater. Sustento documental anexo obligatorio.</p>`;
    return { title, html: shell(title, code, body), sourceTrace };
  }

  if (opts.formatKey.startsWith("fatca_")) {
    const body = `
      <h2>Auto-certificación FATCA / CRS</h2>
      <table>
        ${field("Nombre", p.nombre, src("nombre", "participante"))}
        ${field("Residencia fiscal", p.nacionalidad_pais, src("res", "participante"))}
        ${field("TIN", p.rfc || "Pendiente", src("tin", "participante"))}
        ${field("Clasificación", opts.formatKey === "fatca_pm" ? "ENF (demo)" : "Persona física extranjera", "default demo")}
      </table>
      <p class="note">Declaración bajo protesta de decir verdad. Sustituir en 30 días si cambia la circunstancia.</p>`;
    return { title, html: shell(title, code, body), sourceTrace };
  }

  if (opts.formatKey === "aviso_privacidad") {
    const body = `
      <h2>Acuse de conocimiento</h2>
      <table>
        ${field("Titular", p.nombre, src("nombre", "participante"))}
        ${field("Correo", p.email, src("email", "participante"))}
        ${field("Negocio relacionado", opts.business.nombre, src("neg", "negocio"))}
        ${field("Fecha de acuse", new Date().toISOString().slice(0, 10), "sistema")}
      </table>
      <p class="note">El aviso integral BIM contempla datos de identificación, biométricos (cuando aplique), geolocalización y verificación ante autoridades. En esta demo el acuse es simulado.</p>`;
    return { title, html: shell(title, code, body), sourceTrace };
  }

  return {
    title,
    html: shell(title, code, "<p>Formato no implementado en la demo.</p>"),
    sourceTrace,
  };
}

/** Mock OCR / extracción a partir del nombre del archivo y tipo. */
export function mockExtract(docKey: string, fileName: string): Extracted {
  const base: Extracted = {
    archivo: fileName,
    confianza: "0.72 (mock)",
  };
  if (docKey === "ine" || docKey === "ine_rep" || docKey === "id_rep") {
    return {
      ...base,
      nombre: "Carlos Alberto Ramírez Soto",
      curp: "RASC850214HDFMTR08",
      fecha_nacimiento: "1985-02-14",
      clave_elector: "RMSCRL85021409H800",
      vigencia: "2032",
      nota: "Extracción mock — validar en portal INE",
    };
  }
  if (docKey.startsWith("csf")) {
    return { ...base, rfc: "RASC850214ABC", razon_social: "Carlos Alberto Ramírez Soto" };
  }
  if (docKey.includes("domicilio")) {
    return { ...base, domicilio: "Av. Eugenio Garza Sada 1200, Monterrey, N.L." };
  }
  return base;
}
