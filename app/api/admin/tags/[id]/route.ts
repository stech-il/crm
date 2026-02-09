import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/lib/auth";

async function requireAdmin() {
  const session = await getSession();
  if (!session?.user) return null;
  const user = await prisma.user.findUnique({
    where: { id: (session.user as { id?: string }).id },
    select: { role: true },
  });
  return user?.role === "admin" ? session : null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "לא מורשה" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const tag = await prisma.tag.update({
    where: { id },
    data: { name: body.name, color: body.color },
  });
  return NextResponse.json(tag);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "לא מורשה" }, { status: 403 });
  const { id } = await params;
  await prisma.tag.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
