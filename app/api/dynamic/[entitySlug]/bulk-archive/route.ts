import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ entitySlug: string }> }
) {
  const { entitySlug } = await params;
  try {
    const entity = await prisma.entity.findUnique({ where: { slug: entitySlug } });
    if (!entity) return NextResponse.json({ error: "Entity not found" }, { status: 404 });

    const body = await request.json();
    const ids = Array.isArray(body.ids) ? body.ids.filter((id: unknown) => typeof id === "string") : [];
    if (ids.length === 0) return NextResponse.json({ error: "נא לבחור רשומות" }, { status: 400 });

    await prisma.dynamicRecord.updateMany({
      where: { id: { in: ids }, entityId: entity.id },
      data: { isArchived: true, updatedAt: new Date() },
    });
    return NextResponse.json({ success: true, count: ids.length });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
