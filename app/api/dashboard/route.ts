import { NextResponse } from "next/server";
import { prisma } from "../../lib/db";

export async function GET() {
  try {
    const now = new Date();
    const [entitiesCount, recordsCount, entities, overdueTasks, recentActivity] = await Promise.all([
      prisma.entity.count(),
      prisma.dynamicRecord.count({ where: { isArchived: false } }),
      prisma.entity.findMany({
        orderBy: { order: "asc" },
        include: {
          _count: { select: { records: true } },
        },
      }),
      prisma.recordTask.findMany({
        where: {
          done: false,
          dueDate: { lt: now, not: null },
          record: { isArchived: false },
        },
        include: {
          record: { include: { entity: { select: { slug: true, name: true } } } },
        },
        take: 10,
      }),
      prisma.dynamicActivity.findMany({
        orderBy: { createdAt: "desc" },
        take: 15,
        include: {
          record: { include: { entity: { select: { slug: true, name: true } } } },
          createdBy: { select: { name: true } },
        },
      }),
    ]);
    const activityLabels: Record<string, string> = {
      created: "נוצרה",
      updated: "עודכנה",
      task_added: "נוספה משימה",
      task_done: "הושלמה משימה",
      task_undone: "בוטל סיום",
      call_added: "נרשמה שיחה",
      note_added: "נוספה הערה",
    };

    return NextResponse.json({
      entitiesCount,
      recordsCount,
      overdueTasksCount: overdueTasks.length,
      overdueTasks: overdueTasks.map((t) => ({
        id: t.id,
        title: t.title,
        dueDate: t.dueDate,
        recordId: t.recordId,
        entitySlug: t.record?.entity?.slug,
        entityName: t.record?.entity?.name,
      })),
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        type: a.type,
        label: activityLabels[a.type] || a.type,
        content: a.content,
        createdAt: a.createdAt,
        recordId: a.recordId,
        entitySlug: a.record?.entity?.slug,
        entityName: a.record?.entity?.name,
        createdBy: a.createdBy?.name,
      })),
      entities: entities.map((e) => ({
        id: e.id,
        name: e.name,
        slug: e.slug,
        icon: e.icon,
        recordsCount: e._count.records,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch dashboard" }, { status: 500 });
  }
}
