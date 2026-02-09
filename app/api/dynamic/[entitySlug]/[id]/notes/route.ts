import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/lib/auth";
import { createActivity } from "@/lib/activity";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ entitySlug: string; id: string }> }
) {
  const { entitySlug, id } = await params;
  try {
    const session = await getSession();
    const entity = await prisma.entity.findUnique({ where: { slug: entitySlug } });
    if (!entity) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const record = await prisma.dynamicRecord.findFirst({
      where: { id, entityId: entity.id },
    });
    if (!record) return NextResponse.json({ error: "Record not found" }, { status: 404 });
    const body = await req.json();
    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (!content) return NextResponse.json({ error: "נא להזין תוכן" }, { status: 400 });
    const createdById = (session?.user as { id?: string })?.id || null;
    const note = await prisma.recordNote.create({
      data: { recordId: id, content, createdById },
    });
    await createActivity(id, "note_added", content.slice(0, 100), createdById);
    return NextResponse.json(note);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
