import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/db";

export async function GET() {
  try {
    const entities = await prisma.entity.findMany({
      orderBy: { order: "asc" },
      include: { fields: { orderBy: { order: "asc" } } },
    });
    return NextResponse.json(entities);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch entities" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const entity = await prisma.entity.create({
      data: body,
      include: { fields: true },
    });
    return NextResponse.json(entity);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create entity" }, { status: 500 });
  }
}
