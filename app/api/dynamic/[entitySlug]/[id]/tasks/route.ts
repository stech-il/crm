import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ entitySlug: string; id: string }> }
) {
  const { entitySlug, id } = await params;
  try {
    const entity = await prisma.entity.findUnique({ where: { slug: entitySlug } });
    if (!entity) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const tasks = await prisma.recordTask.findMany({
      where: { recordId: id, record: { entityId: entity.id } },
      orderBy: { order: "asc" },
    });
    return NextResponse.json(tasks);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

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
    const { title } = await req.json();
    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "נא להזין כותרת" }, { status: 400 });
    }
    const maxOrder = await prisma.recordTask
      .aggregate({ where: { recordId: id }, _max: { order: true } })
      .then((r) => r._max.order ?? -1);
    const task = await prisma.recordTask.create({
      data: {
        recordId: id,
        title: title.trim(),
        order: maxOrder + 1,
        createdById: (session?.user as { id?: string })?.id || null,
      },
    });
    return NextResponse.json(task);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
