import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "לא מורשה" }, { status: 403 });
  }
  const list = await prisma.webhook.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "לא מורשה" }, { status: 403 });
  }
  const body = await req.json();
  const { name, url, secret, events, entitySlug } = body;
  if (!name || !url) return NextResponse.json({ error: "חסר name או url" }, { status: 400 });
  const eventsStr = Array.isArray(events) ? JSON.stringify(events) : JSON.stringify(["record.created", "record.updated"]);
  const created = await prisma.webhook.create({
    data: {
      name,
      url,
      secret: secret || null,
      events: eventsStr,
      entitySlug: entitySlug || null,
    },
  });
  return NextResponse.json(created);
}
