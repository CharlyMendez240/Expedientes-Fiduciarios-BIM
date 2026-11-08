import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ensureSeed } from "@/lib/db";

export default async function ClienteHome() {
  await ensureSeed();
  const user = await getSession();
  if (user?.role === "cliente") redirect("/cliente/carga");
  redirect("/cliente/acceso");
}
