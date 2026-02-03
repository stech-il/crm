import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const managerId = searchParams.get("managerId");
    const settlement = searchParams.get("settlement");
    const sort = searchParams.get("sort") || "createdAt";
    const order = searchParams.get("order") || "desc";

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { primaryPhone: { contains: search, mode: "insensitive" } },
        { settlement: { contains: search, mode: "insensitive" } },
      ];
    }
    if (managerId) where.managerId = managerId;
    if (settlement) where.settlement = settlement;

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { [sort]: order },
      include: { manager: true },
    });
    return NextResponse.json(customers);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const customer = await prisma.customer.create({
      data: body,
      include: { manager: true },
    });
    return NextResponse.json(customer);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}
