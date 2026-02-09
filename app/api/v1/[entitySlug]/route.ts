import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { validateApiKey, hasPermission } from "@/lib/apiKey";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entitySlug: string }> }
) {
  const auth = await validateApiKey(request.headers.get("authorization"));
  if (!auth || !hasPermission(auth.permissions, "records:read")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { entitySlug } = await params;
  const entity = await prisma.entity.findUnique({
    where: { slug: entitySlug },
    include: { fields: { orderBy: { order: "asc" } } },
  });
  if (!entity) return NextResponse.json({ error: "Entity not found" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));

  let records = await prisma.dynamicRecord.findMany({
    where: { entityId: entity.id, isArchived: false },
    orderBy: { updatedAt: "desc" },
  });

  if (search) {
    records = records.filter((r) => JSON.stringify(r.data).toLowerCase().includes(search.toLowerCase()));
  }

  const total = records.length;
  const offset = (page - 1) * limit;
  const paginated = records.slice(offset, offset + limit);

  return NextResponse.json({
    entity: { slug: entity.slug, name: entity.name },
    records: paginated.map((r) => ({ id: r.id, data: r.data, createdAt: r.createdAt, updatedAt: r.updatedAt })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ entitySlug: string }> }
) {
  const auth = await validateApiKey(request.headers.get("authorization"));
  if (!auth || !hasPermission(auth.permissions, "records:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { entitySlug } = await params;
  const entity = await prisma.entity.findUnique({ where: { slug: entitySlug } });
  if (!entity) return NextResponse.json({ error: "Entity not found" }, { status: 404 });

  const body = await request.json();
  const record = await prisma.dynamicRecord.create({
    data: { entityId: entity.id, data: body.data || {} },
  });
  return NextResponse.json({ id: record.id, data: record.data, createdAt: record.createdAt, updatedAt: record.updatedAt });
}
