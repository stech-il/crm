import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ entitySlug: string; id: string }> }
) {
  const { entitySlug, id } = await params;
  const record = await prisma.dynamicRecord.findFirst({
    where: { id, entity: { slug: entitySlug } },
    include: { tags: { include: { tag: true } } },
  });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(record.tags.map((rt) => rt.tag));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ entitySlug: string; id: string }> }
) {
  const { entitySlug, id } = await params;
  const record = await prisma.dynamicRecord.findFirst({
    where: { id, entity: { slug: entitySlug } },
  });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json();
  const tagId = body.tagId;
  if (!tagId) return NextResponse.json({ error: "tagId required" }, { status: 400 });
  await prisma.recordTag.upsert({
    where: { recordId_tagId: { recordId: id, tagId } },
    create: { recordId: id, tagId },
    update: {},
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ entitySlug: string; id: string }> }
) {
  const { entitySlug, id } = await params;
  const record = await prisma.dynamicRecord.findFirst({
    where: { id, entity: { slug: entitySlug } },
  });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { searchParams } = new URL(req.url);
  const tagId = searchParams.get("tagId");
  if (!tagId) return NextResponse.json({ error: "tagId required" }, { status: 400 });
  await prisma.recordTag.deleteMany({
    where: { recordId: id, tagId },
  });
  return NextResponse.json({ success: true });
}
