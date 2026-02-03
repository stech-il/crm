import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const entity = await prisma.entity.findUnique({
      where: { id },
      include: { fields: { orderBy: { order: "asc" } } },
    });
    if (!entity) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(entity);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch entity" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const entity = await prisma.entity.update({
      where: { id },
      data: body,
      include: { fields: true },
    });
    return NextResponse.json(entity);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update entity" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.entity.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete entity" }, { status: 500 });
  }
}
