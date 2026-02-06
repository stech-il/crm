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
    const calls = await prisma.callLog.findMany({
      where: { recordId: id },
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { name: true } } },
    });
    return NextResponse.json(calls);
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
    const body = await req.json();
    const { phoneNumber, direction, duration, notes } = body;
    if (!phoneNumber || typeof phoneNumber !== "string") {
      return NextResponse.json({ error: "נא להזין מספר טלפון" }, { status: 400 });
    }
    const call = await prisma.callLog.create({
      data: {
        recordId: id,
        phoneNumber: phoneNumber.trim(),
        direction: direction || "outgoing",
        duration: typeof duration === "number" ? duration : null,
        notes: typeof notes === "string" ? notes : null,
        createdById: (session?.user as { id?: string })?.id || null,
      },
    });
    return NextResponse.json(call);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
