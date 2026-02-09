import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/lib/auth";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "לא מורשה" }, { status: 403 });
  }
  const { id } = await params;
  await prisma.apiKey.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
