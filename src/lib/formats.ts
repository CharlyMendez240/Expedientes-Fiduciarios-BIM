export type FormatDef = {
  key: string;
  title: string;
  code: string;
  scope: "negocio" | "participante";
  appliesTo?: Array<"PF" | "PM" | "nacional" | "extranjero">;
};

export const FORMATS: FormatDef[] = [
  {
    key: "alta_checklist",
    title: "Alta en sistema fiduciario y lista de comprobación",
    code: "FI-FSO-FID-03",
    scope: "negocio",
  },
  {
    key: "caratula_ofid",
    title: "Carátula OFID",
    code: "FI-FSO-FID-01",
    scope: "negocio",
  },
  {
    key: "kyc_pf",
    title: "KYC Persona Física",
    code: "FI-FSO-FID-E-08",
    scope: "participante",
    appliesTo: ["PF", "nacional"],
  },
  {
    key: "kyc_pm",
    title: "KYC Persona Moral",
    code: "FI-FSO-FID-E-09",
    scope: "participante",
    appliesTo: ["PM", "nacional"],
  },
  {
    key: "kyc_np",
    title: "KYC Natural Person",
    code: "FI-FSO-FID-E-10",
    scope: "participante",
    appliesTo: ["PF", "extranjero"],
  },
  {
    key: "kyc_le",
    title: "KYC Legal Entity",
    code: "FI-FSO-FID-E-11",
    scope: "participante",
    appliesTo: ["PM", "extranjero"],
  },
  {
    key: "bc_pf",
    title: "Beneficiario controlador PF",
    code: "FI-FSO-FID-E-06",
    scope: "participante",
    appliesTo: ["PF"],
  },
  {
    key: "bc_pm",
    title: "Beneficiario controlador PM",
    code: "FI-FSO-FID-E-07",
    scope: "participante",
    appliesTo: ["PM"],
  },
  {
    key: "fatca_pf",
    title: "FATCA/CRS Cliente extranjero PF",
    code: "FI-IMP-FIS-E-13",
    scope: "participante",
    appliesTo: ["PF", "extranjero"],
  },
  {
    key: "fatca_pm",
    title: "FATCA/CRS Persona moral extranjera",
    code: "FI-IMP-FIS-E-14",
    scope: "participante",
    appliesTo: ["PM", "extranjero"],
  },
  {
    key: "aviso_privacidad",
    title: "Aviso de privacidad integral clientes",
    code: "LFPD / BIM",
    scope: "participante",
  },
];

export function formatByKey(key: string) {
  return FORMATS.find((f) => f.key === key);
}

export function formatsForParticipant(
  selected: string[],
  tipo: "PF" | "PM",
  nacionalidad: "nacional" | "extranjero",
) {
  return FORMATS.filter((f) => {
    if (!selected.includes(f.key)) return false;
    if (f.scope === "negocio") return false;
    if (!f.appliesTo) return true;
    const needsTipo = f.appliesTo.includes("PF") || f.appliesTo.includes("PM");
    const needsNac =
      f.appliesTo.includes("nacional") || f.appliesTo.includes("extranjero");
    if (needsTipo && !f.appliesTo.includes(tipo)) return false;
    if (needsNac && !f.appliesTo.includes(nacionalidad)) return false;
    return true;
  });
}
