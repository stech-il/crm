import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "לא מורשה" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  const updated = await prisma.campaign.update({
    where: { id },
    data: {
      ...(body.name != null && { name: body.name }),
      ...(body.description != null && { description: body.description }),
      ...(body.startDate != null && { startDate: body.startDate ? new Date(body.startDate) : null }),
      ...(body.endDate != null && { endDate: body.endDate ? new Date(body.endDate) : null }),
      ...(body.status != null && { status: body.status }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "לא מורשה" }, { status: 403 });
  }
  const { id } = await params;
  await prisma.campaign.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
