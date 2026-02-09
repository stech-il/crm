import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/lib/auth";
import { createActivity } from "@/lib/activity";
import { triggerWebhooks } from "@/lib/webhooks";
import { logAudit } from "@/lib/audit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ entitySlug: string }> }
) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "לא מורשה" }, { status: 401 });

  const { entitySlug } = await params;
  const entity = await prisma.entity.findUnique({
    where: { slug: entitySlug },
    include: { fields: true },
  });
  if (!entity) return NextResponse.json({ error: "Entity not found" }, { status: 404 });

  const body = await request.json();
  const { ids, field, value } = body as { ids?: string[]; field?: string; value?: unknown };
  if (!Array.isArray(ids) || ids.length === 0 || !field) {
    return NextResponse.json({ error: "חסר ids או field" }, { status: 400 });
  }

  const createdById = (session.user as { id?: string }).id || null;
  let updated = 0;

  for (const id of ids) {
    const record = await prisma.dynamicRecord.findFirst({
      where: { id, entityId: entity.id },
    });
    if (!record) continue;

    const data = record.data as Record<string, unknown>;
    const nextData = { ...data, [field]: value };
    await prisma.dynamicRecord.update({
      where: { id },
      data: { data: JSON.parse(JSON.stringify(nextData)), updatedAt: new Date() },
    });
    await createActivity(id, "updated", null, createdById);
    await triggerWebhooks("record.updated", entitySlug, id, nextData, data);
    updated++;
  }

  await logAudit({
    userId: createdById ?? undefined,
    action: "record.update",
    entitySlug,
    details: { bulk: true, count: updated, field },
  });

  return NextResponse.json({ updated });
}
