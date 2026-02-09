import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "לא מורשה" }, { status: 403 });
  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(tags);
}
