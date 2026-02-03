import { NextResponse } from "next/server";
import { prisma } from "../../lib/db";

export async function GET() {
  try {
    const entitiesCount = await prisma.entity.count();
    const recordsCount = await prisma.dynamicRecord.count();
    return NextResponse.json({
      entitiesCount,
      recordsCount,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch dashboard" }, { status: 500 });
  }
}
