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

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "לא מורשה" }, { status: 403 });
  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(tags);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "לא מורשה" }, { status: 403 });
  const body = await req.json();
  const tag = await prisma.tag.create({
    data: { name: body.name || "תגית", color: body.color || "#6366f1" },
  });
  return NextResponse.json(tag);
}
