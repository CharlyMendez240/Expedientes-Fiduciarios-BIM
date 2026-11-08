import { redirect } from "next/navigation";

/** La vista de expediente quedó unificada en el detalle por pestañas. */
export default async function ExpedienteRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/ejecutivo/negocios/${id}?tab=0`);
}
