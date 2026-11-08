import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ensureSeed, sql } from "@/lib/db";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  await ensureSeed();
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const rows = await sql<{
    content_base64: string;
    file_name: string;
    mime_type: string;
    ejecutivo_id: string;
    email: string;
    cliente_user_id: string | null;
  }>(
    `select d.content_base64, d.file_name, d.mime_type, b.ejecutivo_id, p.email, r.cliente_user_id
     from documents d
     join requests r on r.id = d.request_id
     join participants p on p.id = r.participant_id
     join businesses b on b.id = r.business_id
     where d.id = $1`,
    [id],
  );
  const row = rows[0];
  if (!row) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const allowed =
    (user.role === "ejecutivo" && row.ejecutivo_id === user.id) ||
    (user.role === "cliente" &&
      (row.cliente_user_id === user.id || row.email.toLowerCase() === user.email.toLowerCase()));
  if (!allowed) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const buf = Buffer.from(row.content_base64, "base64");
  return new NextResponse(buf, {
    headers: {
      "Content-Type": row.mime_type || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${row.file_name}"`,
    },
  });
}
