import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const activities = await prisma.activity.findMany({
      where: { customerId: id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(activities);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const activity = await prisma.activity.create({
      data: { ...body, customerId: id },
    });
    return NextResponse.json(activity);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create activity" }, { status: 500 });
  }
}
