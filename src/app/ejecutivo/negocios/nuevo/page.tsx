import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { createBusinessAction } from "@/lib/actions";
import { getSession } from "@/lib/auth";
import { FORMATS } from "@/lib/formats";

export default async function NuevoNegocioPage() {
  const user = await getSession();
  if (!user || user.role !== "ejecutivo") redirect("/");

  return (
    <div className="shell">
      <AppHeader user={user} crumb="Nuevo negocio" />
      <main className="container fade-in">
        <Link href="/ejecutivo" className="muted">
          ← Volver
        </Link>
        <h1 className="section-title" style={{ marginTop: "0.75rem" }}>
          Alta de negocio
        </h1>
        <p className="muted">Datos generales capturados por el ejecutivo (sin Gestor Fiduciario).</p>

        <form action={createBusinessAction} className="panel stack" style={{ marginTop: "1rem" }}>
          <div className="grid-2">
            <div>
              <label htmlFor="folio">Folio / no. fideicomiso</label>
              <input id="folio" name="folio" placeholder="FIDE-2026-XXXX" />
            </div>
            <div>
              <label htmlFor="tipo_contrato">Tipo de contrato</label>
              <select id="tipo_contrato" name="tipo_contrato" defaultValue="Fideicomiso">
                <option>Fideicomiso</option>
                <option>Mandato</option>
                <option>Comisión</option>
                <option>Administración</option>
                <option>Garantía</option>
                <option>Inversión</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="nombre">Nombre del negocio</label>
            <input id="nombre" name="nombre" required placeholder="Fideicomiso ..." />
          </div>
          <div className="check-item">
            <input id="credito_bim" name="credito_bim" type="checkbox" />
            <label htmlFor="credito_bim" style={{ margin: 0 }}>
              Con crédito BIM
            </label>
          </div>
          <div>
            <label htmlFor="descripcion">Descripción</label>
            <textarea id="descripcion" name="descripcion" />
          </div>
          <div className="grid-2">
            <div>
              <label htmlFor="patrimonio_tipo">Tipo de patrimonio</label>
              <input id="patrimonio_tipo" name="patrimonio_tipo" placeholder="Inmueble, efectivo..." />
            </div>
            <div>
              <label htmlFor="patrimonio_valor">Valor del patrimonio</label>
              <input id="patrimonio_valor" name="patrimonio_valor" placeholder="$ ..." />
            </div>
          </div>
          <div>
            <label htmlFor="patrimonio_desc">Descripción del patrimonio</label>
            <textarea id="patrimonio_desc" name="patrimonio_desc" />
          </div>
          <div className="grid-2">
            <div>
              <label htmlFor="honorarios_aceptacion">Honorarios de aceptación</label>
              <input id="honorarios_aceptacion" name="honorarios_aceptacion" />
            </div>
            <div>
              <label htmlFor="honorarios_admin">Honorarios de administración</label>
              <input id="honorarios_admin" name="honorarios_admin" />
            </div>
          </div>
          <div>
            <label htmlFor="fines">Fines del negocio</label>
            <textarea id="fines" name="fines" />
          </div>

          <div>
            <h2 style={{ fontSize: "1.05rem", marginBottom: "0.5rem" }}>Formatos a generar</h2>
            <div className="check-grid">
              {FORMATS.map((f) => (
                <label key={f.key} className="check-item">
                  <input
                    type="checkbox"
                    name={`fmt_${f.key}`}
                    defaultChecked={[
                      "alta_checklist",
                      "caratula_ofid",
                      "kyc_pf",
                      "kyc_pm",
                      "aviso_privacidad",
                    ].includes(f.key)}
                  />
                  <span>
                    <strong>{f.title}</strong>
                    <div className="muted" style={{ fontSize: "0.8rem" }}>
                      {f.code} · {f.scope}
                    </div>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <button className="btn btn-primary" type="submit">
            Guardar negocio
          </button>
        </form>
      </main>
    </div>
  );
}
