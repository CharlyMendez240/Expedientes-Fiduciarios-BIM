import Link from "next/link";
import { logoutAction } from "@/lib/actions";
import type { SessionUser } from "@/lib/auth";
import { BimLogo } from "./BimLogo";

export function AppHeader({
  user,
  crumb,
}: {
  user: SessionUser;
  crumb?: string;
}) {
  const home =
    user.role === "superusuario" ? "/admin" : user.role === "ejecutivo" ? "/ejecutivo" : "/cliente/carga";

  const roleLabel =
    user.role === "superusuario" ? "Superusuario" : user.role === "ejecutivo" ? "Ejecutivo" : "Cliente";

  return (
    <header className="topbar">
      <Link href={home} className="brand-mark">
        <BimLogo variant="light" compact />
        <div>
          <div className="title">Expedientes Digitales</div>
          <div className="subtitle">{crumb || "Banco Inmobiliario Mexicano"}</div>
        </div>
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {user.role === "superusuario" ? (
          <nav style={{ display: "flex", gap: "0.45rem" }}>
            <Link className="btn btn-secondary" href="/admin/usuarios" style={{ padding: "0.45rem 0.85rem" }}>
              Usuarios
            </Link>
            <Link className="btn btn-secondary" href="/admin/formatos" style={{ padding: "0.45rem 0.85rem" }}>
              Formatos
            </Link>
          </nav>
        ) : null}
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{user.name}</div>
          <div className="muted" style={{ fontSize: "0.75rem" }}>
            {roleLabel} · {user.email}
          </div>
        </div>
        <form action={logoutAction}>
          <button className="btn btn-secondary" type="submit">
            Salir
          </button>
        </form>
      </div>
    </header>
  );
}
