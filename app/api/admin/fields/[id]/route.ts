import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { entityId, ...data } = body;
    const field = await prisma.fieldDefinition.update({
      where: { id },
      data,
    });
    return NextResponse.json(field);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update field" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.fieldDefinition.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete field" }, { status: 500 });
  }
}
