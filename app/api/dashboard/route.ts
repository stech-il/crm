import { NextResponse } from "next/server";
import { prisma } from "../../lib/db";

export async function GET() {
  try {
    const [entitiesCount, recordsCount, entities] = await Promise.all([
      prisma.entity.count(),
      prisma.dynamicRecord.count(),
      prisma.entity.findMany({
        orderBy: { order: "asc" },
        include: {
          _count: { select: { records: true } },
        },
      }),
    ]);
    return NextResponse.json({
      entitiesCount,
      recordsCount,
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
