export type TabDoc = {
  key: string;
  label: string;
  required?: boolean;
};

export type ExpedienteTab = {
  key: string;
  title: string;
  description: string;
  documents: TabDoc[];
};

/**
 * Pestañas 1–7 del expediente.
 * Pestaña 2 (Participantes) = documentación que se puede solicitar al cliente.
 */
export const EXPEDIENTE_TABS: ExpedienteTab[] = [
  {
    key: "1",
    title: "1 · Datos generales",
    description: "Alta, carátula OFID y documentos base del negocio.",
    documents: [
      { key: "carta_complemento", label: "Carta complemento", required: true },
      { key: "alta_firmada", label: "Alta en sistema fiduciario / lista de comprobación", required: true },
      { key: "caratula_ofid", label: "Carátula OFID", required: true },
      { key: "sesion_comite", label: "Sesión de comité / autorizaciones", required: false },
      { key: "correos_autorizacion", label: "Correos de autorización", required: false },
    ],
  },
  {
    key: "2",
    title: "2 · Participantes",
    description: "Documentación del cliente. El ejecutivo elige qué solicitar en la invitación.",
    documents: [
      { key: "ine", label: "Identificación oficial (INE) — frente y reverso", required: true },
      { key: "curp", label: "CURP", required: true },
      { key: "csf", label: "Constancia de situación fiscal (≤ 3 meses)", required: true },
      { key: "domicilio", label: "Comprobante de domicilio (≤ 3 meses)", required: true },
      { key: "kyc", label: "KYC (PF/PM / Natural Person / Legal Entity)", required: true },
      { key: "aviso_privacidad", label: "Aviso de privacidad firmado / acuse", required: true },
      { key: "fiel", label: "FIEL / e.firma", required: false },
      { key: "fatca", label: "FATCA/CRS (si aplica)", required: false },
      { key: "bc", label: "Beneficiario controlador", required: false },
    ],
  },
  {
    key: "3",
    title: "3 · Documentación fiduciaria",
    description: "Contrato, anexos, comité y beneficiario controlador.",
    documents: [
      { key: "contrato", label: "Contrato / registro del fideicomiso", required: true },
      { key: "anexos", label: "Anexos del contrato", required: false },
      { key: "comite_tecnico", label: "Documentación de comité técnico", required: false },
      { key: "bc_anexo", label: "Sustento de beneficiario controlador", required: false },
    ],
  },
  {
    key: "4",
    title: "4 · Cuenta bancaria",
    description: "Opcional — carátula de cuenta BIM o Santander.",
    documents: [{ key: "caratula_cuenta", label: "Carátula de cuenta bancaria", required: false }],
  },
  {
    key: "5",
    title: "5 · Facturación y pagos",
    description: "Pago de aceptación, anualidad y facturas.",
    documents: [
      { key: "pago_aceptacion", label: "Comprobante de pago de aceptación", required: true },
      { key: "pago_anualidad", label: "Comprobante de anualidad", required: false },
      { key: "facturas", label: "Facturas relacionadas", required: false },
    ],
  },
  {
    key: "6",
    title: "6 · Inmuebles",
    description: "Condicionado al patrimonio inmobiliario.",
    documents: [
      { key: "control_inmobiliario", label: "Control inmobiliario", required: false },
      { key: "escrituras", label: "Escrituras / título", required: false },
      { key: "clg", label: "CLG / predial", required: false },
    ],
  },
  {
    key: "7",
    title: "7 · Acciones y otros bienes",
    description: "Títulos, constitutivas e intermediación — opcional.",
    documents: [
      { key: "titulos", label: "Títulos accionarios / constitutivas", required: false },
      { key: "casa_bolsa", label: "Constancia casa de bolsa / intermediación", required: false },
      { key: "dictamen", label: "Dictamen u otros", required: false },
    ],
  },
];

/** Pestaña cuyas piezas el ejecutivo selecciona al solicitar al cliente. */
export const CLIENT_REQUEST_TAB = "2";

export function tabByKey(key: string) {
  return EXPEDIENTE_TABS.find((t) => t.key === key);
}

export function clientRequestDocs() {
  return tabByKey(CLIENT_REQUEST_TAB)?.documents ?? [];
}
