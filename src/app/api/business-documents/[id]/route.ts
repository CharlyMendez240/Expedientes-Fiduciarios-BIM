import { NextResponse } from "next/server";
import { canAccessBusiness, getSession } from "@/lib/auth";
import { ensureSeed, sql } from "@/lib/db";
import { filePreviewResponse } from "@/lib/file-preview";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  await ensureSeed();
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await ctx.params;

  const rows = await sql<{
    content_base64: string;
    file_name: string;
    mime_type: string;
    ejecutivo_id: string;
    region_id: string | null;
    business_id: string;
    request_id: string | null;
  }>(
    `select d.content_base64, d.file_name, d.mime_type, b.ejecutivo_id, b.region_id, d.business_id, d.request_id
     from business_documents d
     join businesses b on b.id = d.business_id
     where d.id = $1`,
    [id],
  );
  const row = rows[0];
  if (!row) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  if (user.role === "cliente") {
    if (!row.request_id) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    const owned = await sql<{ id: string }>(
      "select id from requests where id = $1 and business_id = $2 and cliente_user_id = $3",
      [row.request_id, row.business_id, user.id],
    );
    if (!owned[0]) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  } else if (!(await canAccessBusiness(user, row))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  return filePreviewResponse(row.file_name, Buffer.from(row.content_base64, "base64"));
}
