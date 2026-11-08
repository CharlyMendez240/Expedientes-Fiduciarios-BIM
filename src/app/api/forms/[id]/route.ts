import { NextResponse } from "next/server";
import { canAccessBusiness, getSession } from "@/lib/auth";
import { ensureSeed, sql } from "@/lib/db";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  await ensureSeed();
  const user = await getSession();
  if (!user || (user.role !== "ejecutivo" && user.role !== "superusuario")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const rows = await sql<{
    html_content: string;
    title: string;
    ejecutivo_id: string;
    region_id: string | null;
  }>(
    `select f.html_content, f.title, b.ejecutivo_id, b.region_id
     from generated_forms f
     join businesses b on b.id = f.business_id
     where f.id = $1`,
    [id],
  );
  const row = rows[0];
  if (!row || !(await canAccessBusiness(user, row))) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  return new NextResponse(row.html_content, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="${row.title.replace(/[^\w\-]+/g, "_")}.html"`,
    },
  });
}
