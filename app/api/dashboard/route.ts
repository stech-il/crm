import { NextResponse } from "next/server";
import { prisma } from "../../lib/db";

export async function GET() {
  try {
    const now = new Date();
    const [entitiesCount, recordsCount, entities, overdueTasks] = await Promise.all([
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
    ]);
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
