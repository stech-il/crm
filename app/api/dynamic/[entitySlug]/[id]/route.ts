import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { getSession } from "@/lib/auth";
import { createActivity } from "@/lib/activity";
import { triggerWebhooks } from "@/lib/webhooks";
import { logAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { runWorkflowRules } from "@/lib/workflow";

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
        assignedTo: { select: { id: true, name: true } },
        tasks: { orderBy: { order: "asc" } },
        callLogs: { orderBy: { createdAt: "desc" }, include: { createdBy: { select: { name: true } } } },
        notes: { orderBy: { createdAt: "desc" }, include: { createdBy: { select: { name: true } } } },
        tags: { include: { tag: true } },
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
    const userEmail = (session?.user as { email?: string })?.email;

    const existing = await prisma.dynamicRecord.findUnique({ where: { id } });
    const previousData = existing?.data as Record<string, unknown> | undefined;

    const updateData: { data?: object; isArchived?: boolean; assignedToId?: string | null; updatedAt: Date } = { updatedAt: new Date() };
    if (body.data !== undefined) updateData.data = body.data;
    if (typeof body.isArchived === "boolean") updateData.isArchived = body.isArchived;
    if (body.assignedToId !== undefined) updateData.assignedToId = body.assignedToId || null;

    const record = await prisma.dynamicRecord.update({
      where: { id },
      data: updateData,
    });
    if (body.assignedToId && body.assignedToId !== existing?.assignedToId) {
      try {
        await createNotification(
          body.assignedToId,
          "assignment",
          "הוקצית לרשומה",
          `הוקצית לרשומה ב-${entity.name}`,
          `/dynamic/${entitySlug}/${id}`
        );
      } catch {}
    }
    await createActivity(record.id, "updated", null, createdById);
    await triggerWebhooks("record.updated", entitySlug, record.id, record.data as Record<string, unknown>, previousData);
    await runWorkflowRules(entitySlug, "record.updated", record.id, record.data as Record<string, unknown>);
    if (body.isArchived === true) await triggerWebhooks("record.archived", entitySlug, record.id, record.data as Record<string, unknown>);
    await logAudit({
      userId: createdById ?? undefined,
      userEmail: userEmail ?? undefined,
      action: "record.update",
      entitySlug,
      recordId: record.id,
    });

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
    const session = await getSession();
    const userId = (session?.user as { id?: string })?.id;

    if (permanent) {
      const rec = await prisma.dynamicRecord.findUnique({ where: { id } });
      await prisma.dynamicRecord.delete({ where: { id } });
      await triggerWebhooks("record.deleted", entitySlug, id, rec?.data as Record<string, unknown>);
      await logAudit({ userId, action: "record.delete", entitySlug, recordId: id });
    } else {
      await prisma.dynamicRecord.update({
        where: { id },
        data: { isArchived: true, updatedAt: new Date() },
      });
      const rec = await prisma.dynamicRecord.findUnique({ where: { id } });
      await triggerWebhooks("record.archived", entitySlug, id, rec?.data as Record<string, unknown>);
      await logAudit({ userId, action: "record.archive", entitySlug, recordId: id });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete record" }, { status: 500 });
  }
}
