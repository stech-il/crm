import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { getSession } from "@/lib/auth";
import { createActivity } from "@/lib/activity";

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
      include: {
        activities: { orderBy: { createdAt: "desc" }, include: { createdBy: { select: { name: true } } } },
        files: true,
        createdBy: { select: { id: true, name: true } },
        tasks: { orderBy: { order: "asc" } },
        callLogs: { orderBy: { createdAt: "desc" }, include: { createdBy: { select: { name: true } } } },
        notes: { orderBy: { createdAt: "desc" }, include: { createdBy: { select: { name: true } } } },
      },
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
    const session = await getSession();
    const createdById = (session?.user as { id?: string })?.id || null;
    const updateData: { data?: object; isArchived?: boolean; updatedAt: Date } = { updatedAt: new Date() };
    if (body.data !== undefined) updateData.data = body.data;
    if (typeof body.isArchived === "boolean") updateData.isArchived = body.isArchived;
    const record = await prisma.dynamicRecord.update({
      where: { id },
      data: updateData,
    });
    await createActivity(record.id, "updated", null, createdById);
    return NextResponse.json(record);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update record" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ entitySlug: string; id: string }> }
) {
  const { entitySlug, id } = await params;
  try {
    const entity = await prisma.entity.findUnique({ where: { slug: entitySlug } });
    if (!entity) return NextResponse.json({ error: "Entity not found" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get("permanent") === "1";

    if (permanent) {
      await prisma.dynamicRecord.delete({ where: { id } });
    } else {
      await prisma.dynamicRecord.update({
        where: { id },
        data: { isArchived: true, updatedAt: new Date() },
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete record" }, { status: 500 });
  }
}
