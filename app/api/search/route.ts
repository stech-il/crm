import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  try {
    const records = await prisma.dynamicRecord.findMany({
      where: { isArchived: false },
      include: { entity: { include: { fields: { orderBy: { order: "asc" } } } } },
    });
    const lower = q.toLowerCase();
    const filtered = records.filter((r) => JSON.stringify(r.data).toLowerCase().includes(lower));
    const results = filtered.slice(0, 15).map((r) => {
      const data = r.data as Record<string, unknown>;
      const firstField = r.entity?.fields?.[0];
      const title = firstField ? String(data[firstField.name] ?? r.id.slice(0, 8)) : r.id.slice(0, 8);
      return {
        id: r.id,
        entitySlug: r.entity?.slug,
        entityName: r.entity?.name,
        title,
        updatedAt: r.updatedAt,
      };
    });
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
