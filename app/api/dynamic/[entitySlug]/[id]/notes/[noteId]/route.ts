import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ entitySlug: string; id: string; noteId: string }> }
) {
  const { entitySlug, id, noteId } = await params;
  try {
    const entity = await prisma.entity.findUnique({ where: { slug: entitySlug } });
    if (!entity) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const note = await prisma.recordNote.findFirst({
      where: { id: noteId, recordId: id, record: { entityId: entity.id } },
    });
    if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.recordNote.delete({ where: { id: noteId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
