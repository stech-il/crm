import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ entitySlug: string; id: string }> }
) {
  const { entitySlug, id } = await params;
  const entity = await prisma.entity.findUnique({ where: { slug: entitySlug } });
  if (!entity) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.recordTemplate.deleteMany({
    where: { id, entityId: entity.id },
  });
  return NextResponse.json({ success: true });
}
