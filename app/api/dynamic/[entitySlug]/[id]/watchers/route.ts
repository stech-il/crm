import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/app/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ entitySlug: string; id: string }> }
) {
  const { id: recordId } = await params;
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "לא מאומת" }, { status: 401 });
  const watchers = await prisma.recordWatcher.findMany({
    where: { recordId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json(watchers.map((w) => w.user));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ entitySlug: string; id: string }> }
) {
  const { entitySlug, id: recordId } = await params;
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "לא מאומת" }, { status: 401 });
  const userId = (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json({ error: "לא מאומת" }, { status: 401 });
  const record = await prisma.dynamicRecord.findUnique({
    where: { id: recordId },
    include: { entity: { select: { name: true } } },
  });
  if (!record) return NextResponse.json({ error: "רשומה לא נמצאה" }, { status: 404 });
  await prisma.recordWatcher.upsert({
    where: { recordId_userId: { recordId, userId } },
    create: { recordId, userId },
    update: {},
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ entitySlug: string; id: string }> }
) {
  const { id: recordId } = await params;
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "לא מאומת" }, { status: 401 });
  const userId = (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json({ error: "לא מאומת" }, { status: 401 });
  await prisma.recordWatcher.deleteMany({ where: { recordId, userId } });
  return NextResponse.json({ ok: true });
}
