import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const field = searchParams.get("field");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (field) where.field = field;

    const certifications = await prisma.certification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { user: true },
    });
    return NextResponse.json(certifications);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch certifications" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cert = await prisma.certification.create({
      data: body,
      include: { user: true },
    });
    return NextResponse.json(cert);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create certification" }, { status: 500 });
  }
}
