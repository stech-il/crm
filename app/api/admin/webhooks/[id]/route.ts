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
  const data: { name?: string; url?: string; secret?: string; events?: string; entitySlug?: string | null; isActive?: boolean } = {};
  if (body.name != null) data.name = body.name;
  if (body.url != null) data.url = body.url;
  if (body.secret != null) data.secret = body.secret || null;
  if (body.events != null) data.events = Array.isArray(body.events) ? JSON.stringify(body.events) : body.events;
  if (body.entitySlug !== undefined) data.entitySlug = body.entitySlug || null;
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;

  const updated = await prisma.webhook.update({
    where: { id },
    data,
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "לא מורשה" }, { status: 403 });
  }
  const { id } = await params;
  await prisma.webhook.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
