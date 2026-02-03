import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const deal = await prisma.deal.findUnique({
      where: { id },
      include: { contact: true },
    });
    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(deal);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch deal" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const deal = await prisma.deal.update({
      where: { id },
      data: body,
      include: { contact: true },
    });
    return NextResponse.json(deal);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update deal" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.deal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete deal" }, { status: 500 });
  }
}
