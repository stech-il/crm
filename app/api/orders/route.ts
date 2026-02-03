import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");

    const where: Record<string, unknown> = {};
    if (customerId) where.customerId = customerId;

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { customer: true },
    });
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const order = await prisma.order.create({
      data: body,
      include: { customer: true },
    });
    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
