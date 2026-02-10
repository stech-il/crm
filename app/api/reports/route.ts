import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/app/lib/db";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "לא מאומת" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const entitySlug = searchParams.get("entity");
  const groupBy = searchParams.get("groupBy") || "stage"; // stage (select field), created (month), entity
  const days = Math.min(365, Math.max(7, parseInt(searchParams.get("days") || "30", 10)));

  const entities = await prisma.entity.findMany({
    orderBy: { order: "asc" },
    include: { fields: { orderBy: { order: "asc" } } },
  });

  if (!entitySlug) {
    const counts = await Promise.all(
      entities.map(async (e) => ({
        slug: e.slug,
        name: e.name,
        total: await prisma.dynamicRecord.count({ where: { entityId: e.id, isArchived: false } }),
        last30: await prisma.dynamicRecord.count({
          where: {
            entityId: e.id,
            isArchived: false,
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        }),
      }))
    );
    return NextResponse.json({ entities: counts });
  }

  const entity = entities.find((e) => e.slug === entitySlug);
  if (!entity) return NextResponse.json({ error: "כרטיס לא נמצא" }, { status: 404 });

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  if (groupBy === "created") {
    const records = await prisma.dynamicRecord.findMany({
      where: { entityId: entity.id, isArchived: false, createdAt: { gte: since } },
      select: { createdAt: true },
    });
    const byMonth: Record<string, number> = {};
    records.forEach((r) => {
      const key = r.createdAt.toISOString().slice(0, 7);
      byMonth[key] = (byMonth[key] || 0) + 1;
    });
    const series = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, count]) => ({ label, count }));
    return NextResponse.json({ entity: { slug: entity.slug, name: entity.name }, groupBy: "created", series });
  }

  const stageField = entity.fields.find((f) => f.type === "select" && (f.name === "stage" || f.name === "status" || f.label?.includes("שלב") || f.label?.includes("סטטוס")));
  const fieldToGroup = groupBy === "stage" && stageField ? stageField : entity.fields.find((f) => f.type === "select" || f.type === "multiselect");
  if (!fieldToGroup) {
    const total = await prisma.dynamicRecord.count({ where: { entityId: entity.id, isArchived: false } });
    const lastPeriod = await prisma.dynamicRecord.count({
      where: { entityId: entity.id, isArchived: false, createdAt: { gte: since } },
    });
    return NextResponse.json({ entity: { slug: entity.slug, name: entity.name }, total, lastPeriod });
  }

  const records = await prisma.dynamicRecord.findMany({
    where: { entityId: entity.id, isArchived: false },
    select: { data: true },
  });
  const byValue: Record<string, number> = {};
  records.forEach((r) => {
    const val = (r.data as Record<string, unknown>)[fieldToGroup.name];
    const key = val != null ? String(val) : "(ריק)";
    byValue[key] = (byValue[key] || 0) + 1;
  });
  const series = Object.entries(byValue)
    .sort(([, a], [, b]) => b - a)
    .map(([label, count]) => ({ label, count }));

  return NextResponse.json({
    entity: { slug: entity.slug, name: entity.name },
    fieldLabel: fieldToGroup.label,
    groupBy: "stage",
    series,
  });
}
