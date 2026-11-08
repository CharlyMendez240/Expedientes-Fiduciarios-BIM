import { redirect } from "next/navigation";

/** Ruta legada: el acceso del cliente ahora es por correo + código. */
export default async function LegacySolicitudPage() {
  redirect("/cliente/acceso");
}
