import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ entitySlug: string }> }
) {
  const { entitySlug } = await params;
  const entity = await prisma.entity.findUnique({ where: { slug: entitySlug } });
  if (!entity) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const templates = await prisma.recordTemplate.findMany({
    where: { entityId: entity.id },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(templates);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ entitySlug: string }> }
) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "לא מורשה" }, { status: 403 });
  const { entitySlug } = await params;
  const entity = await prisma.entity.findUnique({ where: { slug: entitySlug } });
  if (!entity) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json();
  const template = await prisma.recordTemplate.create({
    data: { entityId: entity.id, name: body.name || "תבנית", data: body.data || {} },
  });
  return NextResponse.json(template);
}
