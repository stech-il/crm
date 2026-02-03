import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const activity = await prisma.activity.create({
      data: { ...body, certificationId: id },
    });
    return NextResponse.json(activity);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create activity" }, { status: 500 });
  }
}
