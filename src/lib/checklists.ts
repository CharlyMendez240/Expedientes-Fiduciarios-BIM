export type ChecklistItem = {
  key: string;
  label: string;
  required: boolean;
};

export function checklistFor(
  tipo: "PF" | "PM",
  nacionalidad: "nacional" | "extranjero",
): ChecklistItem[] {
  if (tipo === "PF" && nacionalidad === "nacional") {
    return [
      { key: "ine", label: "Identificación oficial (INE) — frente y reverso", required: true },
      { key: "curp", label: "CURP", required: true },
      { key: "csf", label: "Constancia de situación fiscal (≤ 3 meses)", required: true },
      { key: "domicilio", label: "Comprobante de domicilio (≤ 3 meses)", required: true },
      { key: "fiel", label: "FIEL / e.firma (acuse o certificado)", required: false },
      { key: "acta_edo_civil", label: "Acta de matrimonio / estado civil (si aplica)", required: false },
    ];
  }
  if (tipo === "PF" && nacionalidad === "extranjero") {
    return [
      { key: "pasaporte", label: "Pasaporte vigente", required: true },
      { key: "migratorio", label: "Documento de calidad migratoria", required: true },
      { key: "domicilio_ext", label: "Comprobante de domicilio del lugar de residencia", required: true },
      { key: "tin", label: "Identificación fiscal / TIN", required: true },
      { key: "poder", label: "Poder apostillado (si actúa apoderado)", required: false },
    ];
  }
  if (tipo === "PM" && nacionalidad === "nacional") {
    return [
      { key: "acta_constitutiva", label: "Acta constitutiva e inscripciones", required: true },
      { key: "asamblea", label: "Última asamblea / poderes vigentes", required: true },
      { key: "csf_pm", label: "CSF de la persona moral (≤ 3 meses)", required: true },
      { key: "ine_rep", label: "INE del representante legal", required: true },
      { key: "domicilio_pm", label: "Comprobante de domicilio fiscal", required: true },
      { key: "fiel_pm", label: "FIEL de la persona moral", required: false },
      { key: "estructura", label: "Estructura accionaria / organigrama", required: true },
    ];
  }
  return [
    { key: "acta_apostilla", label: "Acta constitutiva apostillada", required: true },
    { key: "establecimiento", label: "Documento de establecimiento en México", required: true },
    { key: "tin_pm", label: "Identificación fiscal extranjera / TIN", required: true },
    { key: "id_rep", label: "Identificación del representante", required: true },
    { key: "domicilio_le", label: "Comprobante de domicilio", required: true },
    { key: "estructura_le", label: "Estructura de control / accionistas", required: true },
  ];
}
