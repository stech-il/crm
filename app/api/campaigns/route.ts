import { NextResponse } from "next/server";
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
