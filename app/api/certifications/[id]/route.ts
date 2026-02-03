import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const cert = await prisma.certification.findUnique({
      where: { id },
      include: { user: true, activities: { orderBy: { createdAt: "desc" } } },
    });
    if (!cert) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(cert);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch certification" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const cert = await prisma.certification.update({
      where: { id },
      data: body,
      include: { user: true },
    });
    return NextResponse.json(cert);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update certification" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.certification.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete certification" }, { status: 500 });
  }
}
