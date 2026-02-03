import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const module = searchParams.get("module");

    const where: Record<string, unknown> = {};
    if (module) where.module = module;

    const views = await prisma.savedView.findMany({ where });
    return NextResponse.json(views);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch views" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const view = await prisma.savedView.create({ data: body });
    return NextResponse.json(view);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create view" }, { status: 500 });
  }
}
