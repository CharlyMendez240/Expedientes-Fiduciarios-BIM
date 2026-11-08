export function StatusBadge({ status }: { status: string }) {
  const cls = `badge badge-${status.replace(/\s+/g, "_")}`;
  const labels: Record<string, string> = {
    pendiente: "Pendiente",
    cargado: "Cargado",
    validado: "Validado",
    en_proceso: "En proceso",
    borrador: "Borrador",
  };
  return <span className={cls}>{labels[status] || status}</span>;
}
