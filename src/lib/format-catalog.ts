/** Catálogo base de formatos internos BIM para el módulo de parametrización. */
export const FORMAT_CATALOG = [
  {
    key: "alta_checklist",
    title: "Alta en sistema fiduciario y lista de comprobación",
    code: "FI-FSO-FID-03",
    fields: [
      { field_key: "folio", label: "Folio / no. fideicomiso", source_type: "manual_negocio", source_path: "folio" },
      { field_key: "nombre", label: "Nombre del fideicomiso", source_type: "manual_negocio", source_path: "nombre" },
      { field_key: "tipo_contrato", label: "Tipo de contrato", source_type: "manual_negocio", source_path: "tipo_contrato" },
      { field_key: "participante", label: "Participante", source_type: "manual_cliente", source_path: "nombre" },
      { field_key: "rfc", label: "RFC", source_type: "documento", source_path: "csf.rfc" },
    ],
  },
  {
    key: "caratula_ofid",
    title: "Carátula OFID",
    code: "FI-FSO-FID-01",
    fields: [
      { field_key: "folio", label: "Folio", source_type: "manual_negocio", source_path: "folio" },
      { field_key: "nombre", label: "Nombre", source_type: "manual_negocio", source_path: "nombre" },
      { field_key: "fines", label: "Fines", source_type: "manual_negocio", source_path: "fines" },
      { field_key: "patrimonio_valor", label: "Valor patrimonio", source_type: "manual_negocio", source_path: "patrimonio_valor" },
      { field_key: "actividad", label: "Actividad económica", source_type: "manual_cliente", source_path: "actividad_economica" },
    ],
  },
  {
    key: "kyc_pf",
    title: "KYC Persona Física",
    code: "FI-FSO-FID-E-08",
    fields: [
      { field_key: "nombre", label: "Nombre", source_type: "documento", source_path: "ine.nombre" },
      { field_key: "rfc", label: "RFC", source_type: "documento", source_path: "csf.rfc" },
      { field_key: "curp", label: "CURP", source_type: "documento", source_path: "ine.curp" },
      { field_key: "domicilio", label: "Domicilio", source_type: "documento", source_path: "domicilio.domicilio" },
      { field_key: "email", label: "Correo", source_type: "manual_cliente", source_path: "email" },
      { field_key: "fecha_nacimiento", label: "Fecha de nacimiento", source_type: "documento", source_path: "ine.fecha_nacimiento" },
    ],
  },
  {
    key: "aviso_privacidad",
    title: "Aviso de privacidad integral clientes",
    code: "LFPD / BIM",
    fields: [
      { field_key: "titular", label: "Titular", source_type: "manual_cliente", source_path: "nombre" },
      { field_key: "email", label: "Correo", source_type: "manual_cliente", source_path: "email" },
      { field_key: "negocio", label: "Negocio", source_type: "manual_negocio", source_path: "nombre" },
      { field_key: "fecha", label: "Fecha de acuse", source_type: "fijo", source_path: "hoy" },
    ],
  },
] as const;

export type SourceType = "manual_negocio" | "manual_cliente" | "documento" | "fijo";
