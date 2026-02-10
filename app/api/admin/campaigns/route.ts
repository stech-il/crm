import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "לא מאומת" }, { status: 401 });
  const list = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { records: true } } },
  });
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "לא מורשה" }, { status: 403 });
  }
  const body = await req.json();
  const { name, description, startDate, endDate, status } = body;
  if (!name || !name.trim()) return NextResponse.json({ error: "חסר שם קמפיין" }, { status: 400 });
  const created = await prisma.campaign.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      status: status || "active",
    },
  });
  return NextResponse.json(created);
}
