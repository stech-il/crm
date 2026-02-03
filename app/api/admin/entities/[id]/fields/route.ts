import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const fields = await prisma.fieldDefinition.findMany({
      where: { entityId: id },
      orderBy: { order: "asc" },
    });
    return NextResponse.json(fields);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch fields" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const field = await prisma.fieldDefinition.create({
      data: { ...body, entityId: id },
    });
    return NextResponse.json(field);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create field" }, { status: 500 });
  }
}
