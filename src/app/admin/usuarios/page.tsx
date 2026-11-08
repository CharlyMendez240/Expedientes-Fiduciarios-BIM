import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { createRegionAction, createUserAction, updateUserRegionAction } from "@/lib/actions";
import { getSession } from "@/lib/auth";
import { ensureSeed, sql } from "@/lib/db";

export default async function AdminUsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await ensureSeed();
  const user = await getSession();
  if (!user || user.role !== "superusuario") redirect("/");
  const q = await searchParams;

  const regions = await sql<{ id: string; name: string }>(
    "select id, name from regions order by name",
  );
  const users = await sql<{
    id: string;
    email: string;
    name: string;
    role: string;
    region_name: string | null;
  }>(
    `select u.id, u.email, u.name, u.role, r.name as region_name
     from users u
     left join regions r on r.id = u.region_id
     where u.role in ('ejecutivo','superusuario')
     order by u.role desc, u.name`,
  );

  return (
    <div className="shell">
      <AppHeader user={user} crumb="Usuarios y regiones" />
      <main className="container fade-in">
        <h1 className="section-title">Usuarios</h1>
        <p className="muted">
          Ejecutivos de la misma región pueden atender los mismos negocios y solicitudes.
        </p>
        {q.ok ? <div className="flash">Usuario creado.</div> : null}
        {q.error === "password" ? (
          <div className="error">La contraseña debe tener al menos 12 caracteres.</div>
        ) : q.error ? (
          <div className="error">Complete los datos requeridos.</div>
        ) : null}

        <div className="grid-2" style={{ marginTop: "1rem" }}>
          <section className="panel stack">
            <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Alta de usuario</h2>
            <form action={createUserAction} className="stack">
              <div>
                <label htmlFor="name">Nombre</label>
                <input id="name" name="name" required />
              </div>
              <div>
                <label htmlFor="email">Correo</label>
                <input id="email" name="email" type="email" required />
              </div>
              <div>
                <label htmlFor="password">Contraseña temporal</label>
                <input id="password" name="password" type="password" required minLength={12} autoComplete="new-password" />
              </div>
              <div>
                <label htmlFor="role">Rol</label>
                <select id="role" name="role" defaultValue="ejecutivo">
                  <option value="ejecutivo">Ejecutivo</option>
                  <option value="superusuario">Superusuario</option>
                </select>
              </div>
              <div>
                <label htmlFor="region_id">Región</label>
                <select id="region_id" name="region_id" defaultValue={regions[0]?.id || ""}>
                  <option value="">Sin región</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <button className="btn btn-primary" type="submit">
                Crear usuario
              </button>
            </form>
          </section>

          <section className="panel stack">
            <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Nueva región</h2>
            <form action={createRegionAction} className="stack">
              <div>
                <label htmlFor="region_name">Nombre</label>
                <input id="region_name" name="name" required placeholder="Sur, Occidente..." />
              </div>
              <button className="btn btn-secondary" type="submit">
                Agregar región
              </button>
            </form>
            <ul className="muted" style={{ marginBottom: 0 }}>
              {regions.map((r) => (
                <li key={r.id}>{r.name}</li>
              ))}
            </ul>
          </section>
        </div>

        <section className="panel" style={{ marginTop: "1rem" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Región</th>
                <th>Reasignar</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.region_name || "—"}</td>
                  <td>
                    <form action={updateUserRegionAction} style={{ display: "flex", gap: "0.35rem" }}>
                      <input type="hidden" name="user_id" value={u.id} />
                      <select name="region_id" defaultValue="">
                        <option value="">Sin región</option>
                        {regions.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                      <button className="btn btn-secondary" type="submit" style={{ padding: "0.4rem 0.7rem" }}>
                        Guardar
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}
