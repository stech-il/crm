import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ entitySlug: string; id: string }> }
) {
  const { entitySlug, id } = await params;
  try {
    const entity = await prisma.entity.findUnique({
      where: { slug: entitySlug },
      include: { fields: { orderBy: { order: "asc" } } },
    });
    if (!entity) return NextResponse.json({ error: "Entity not found" }, { status: 404 });

    const record = await prisma.dynamicRecord.findFirst({
      where: { id, entityId: entity.id },
      include: { activities: true, files: true },
    });
    if (!record) return NextResponse.json({ error: "Record not found" }, { status: 404 });

    return NextResponse.json({ entity, record });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch record" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ entitySlug: string; id: string }> }
) {
  const { entitySlug, id } = await params;
  try {
    const entity = await prisma.entity.findUnique({ where: { slug: entitySlug } });
    if (!entity) return NextResponse.json({ error: "Entity not found" }, { status: 404 });

    const body = await request.json();
    const record = await prisma.dynamicRecord.update({
      where: { id },
      data: { data: body.data, updatedAt: new Date() },
    });
    return NextResponse.json(record);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update record" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ entitySlug: string; id: string }> }
) {
  const { entitySlug, id } = await params;
  try {
    const entity = await prisma.entity.findUnique({ where: { slug: entitySlug } });
    if (!entity) return NextResponse.json({ error: "Entity not found" }, { status: 404 });

    await prisma.dynamicRecord.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete record" }, { status: 500 });
  }
}
