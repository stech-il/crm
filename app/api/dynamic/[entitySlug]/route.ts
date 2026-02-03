import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entitySlug: string }> }
) {
  const { entitySlug } = await params;
  try {
    const entity = await prisma.entity.findUnique({
      where: { slug: entitySlug },
      include: { fields: { orderBy: { order: "asc" } } },
    });
    if (!entity) return NextResponse.json({ error: "Entity not found" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const where: { entityId: string; data?: unknown } = { entityId: entity.id };
    // Simple search in JSON - for production use raw query
    const records = await prisma.dynamicRecord.findMany({
      where: { entityId: entity.id },
      orderBy: { updatedAt: "desc" },
    });

    const filtered = search
      ? records.filter((r) => {
          const str = JSON.stringify(r.data).toLowerCase();
          return str.includes(search.toLowerCase());
        })
      : records;

    return NextResponse.json({ entity, records: filtered });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ entitySlug: string }> }
) {
  const { entitySlug } = await params;
  try {
    const entity = await prisma.entity.findUnique({
      where: { slug: entitySlug },
      include: { fields: true },
    });
    if (!entity) return NextResponse.json({ error: "Entity not found" }, { status: 404 });

    const body = await request.json();
    const record = await prisma.dynamicRecord.create({
      data: { entityId: entity.id, data: body.data || {} },
    });
    return NextResponse.json(record);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create record" }, { status: 500 });
  }
}
