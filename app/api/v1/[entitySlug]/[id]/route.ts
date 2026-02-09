import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { validateApiKey, hasPermission } from "@/lib/apiKey";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ entitySlug: string; id: string }> }
) {
  const auth = await validateApiKey(_request.headers.get("authorization"));
  if (!auth || !hasPermission(auth.permissions, "records:read")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { entitySlug, id } = await params;
  const entity = await prisma.entity.findUnique({ where: { slug: entitySlug } });
  if (!entity) return NextResponse.json({ error: "Entity not found" }, { status: 404 });

  const record = await prisma.dynamicRecord.findFirst({
    where: { id, entityId: entity.id },
  });
  if (!record) return NextResponse.json({ error: "Record not found" }, { status: 404 });

  return NextResponse.json({ id: record.id, data: record.data, createdAt: record.createdAt, updatedAt: record.updatedAt });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ entitySlug: string; id: string }> }
) {
  const auth = await validateApiKey(request.headers.get("authorization"));
  if (!auth || !hasPermission(auth.permissions, "records:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { entitySlug, id } = await params;
  const entity = await prisma.entity.findUnique({ where: { slug: entitySlug } });
  if (!entity) return NextResponse.json({ error: "Entity not found" }, { status: 404 });

  const body = await request.json();
  const record = await prisma.dynamicRecord.update({
    where: { id },
    data: { data: body.data || {}, updatedAt: new Date() },
  });
  return NextResponse.json({ id: record.id, data: record.data, createdAt: record.createdAt, updatedAt: record.updatedAt });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ entitySlug: string; id: string }> }
) {
  const auth = await validateApiKey(_request.headers.get("authorization"));
  if (!auth || !hasPermission(auth.permissions, "records:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { entitySlug, id } = await params;
  const entity = await prisma.entity.findUnique({ where: { slug: entitySlug } });
  if (!entity) return NextResponse.json({ error: "Entity not found" }, { status: 404 });

  await prisma.dynamicRecord.update({
    where: { id },
    data: { isArchived: true, updatedAt: new Date() },
  });
  return NextResponse.json({ success: true });
}
