import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/lib/auth";
import { createActivity } from "@/lib/activity";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ entitySlug: string }> }
) {
  const { entitySlug } = await params;
  try {
    await getSession();
    const entity = await prisma.entity.findUnique({
      where: { slug: entitySlug },
      include: { fields: { orderBy: { order: "asc" } } },
    });
    if (!entity) return NextResponse.json({ error: "כרטסת לא נמצאה" }, { status: 404 });

    const { sourceId, targetId } = await request.json();
    if (!sourceId || !targetId || sourceId === targetId) {
      return NextResponse.json({ error: "נא לבחור רשומת מקור ורשומת יעד שונות" }, { status: 400 });
    }

    const [source, target] = await Promise.all([
      prisma.dynamicRecord.findFirst({ where: { id: sourceId, entityId: entity.id }, include: { tasks: true, notes: true, callLogs: true, tags: true, activities: true } }),
      prisma.dynamicRecord.findFirst({ where: { id: targetId, entityId: entity.id } }),
    ]);
    if (!source || !target) return NextResponse.json({ error: "רשומה לא נמצאה" }, { status: 404 });

    const sourceData = source.data as Record<string, unknown>;
    const targetData = target.data as Record<string, unknown>;
    const merged: Record<string, unknown> = { ...targetData };
    for (const f of entity.fields) {
      const tv = targetData[f.name];
      const sv = sourceData[f.name];
      if ((tv === undefined || tv === null || tv === "") && sv !== undefined && sv !== null && sv !== "") {
        merged[f.name] = sv;
      }
    }
    await prisma.dynamicRecord.update({
      where: { id: targetId },
      data: { data: merged, updatedAt: new Date() },
    });

    await prisma.recordTask.updateMany({ where: { recordId: sourceId }, data: { recordId: targetId } });
    await prisma.recordNote.updateMany({ where: { recordId: sourceId }, data: { recordId: targetId } });
    await prisma.callLog.updateMany({ where: { recordId: sourceId }, data: { recordId: targetId } });
    await prisma.dynamicActivity.updateMany({ where: { recordId: sourceId }, data: { recordId: targetId } });
    const sourceTagIds = (source.tags || []).map((t) => t.tagId);
    const targetTags = await prisma.recordTag.findMany({ where: { recordId: targetId }, select: { tagId: true } });
    const targetTagIds = new Set(targetTags.map((t) => t.tagId));
    for (const tagId of sourceTagIds) {
      if (!targetTagIds.has(tagId)) await prisma.recordTag.create({ data: { recordId: targetId, tagId } });
    }
    await prisma.recordTag.deleteMany({ where: { recordId: sourceId } });
    await prisma.recordFile.updateMany({ where: { recordId: sourceId }, data: { recordId: targetId } });

    await prisma.dynamicRecord.delete({ where: { id: sourceId } });
    await createActivity(targetId, "updated", "מיזוג רשומות", null);

    return NextResponse.json({ success: true, targetId });
  } catch (e) {
    return NextResponse.json({ error: "שגיאה במיזוג" }, { status: 500 });
  }
}
