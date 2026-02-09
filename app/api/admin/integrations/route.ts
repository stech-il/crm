import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/lib/auth";
import { encryptJson } from "@/lib/encryption";

export async function GET() {
  const session = await getSession();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "לא מורשה" }, { status: 403 });
  }
  const list = await prisma.integration.findMany({
    orderBy: { type: "asc" },
    select: {
      id: true,
      type: true,
      name: true,
      isActive: true,
      config: true,
      createdAt: true,
      _count: { select: { logs: true } },
    },
  });
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "לא מורשה" }, { status: 403 });
  }
  const body = await req.json();
  const { type, name, credentials, config } = body;
  if (!type || !name) return NextResponse.json({ error: "חסר type או name" }, { status: 400 });

  const encrypted = encryptJson(credentials || {});
  const created = await prisma.integration.create({
    data: {
      type,
      name,
      credentials: encrypted,
      config: config || {},
    },
  });
  return NextResponse.json({ id: created.id, type: created.type, name: created.name });
}
