import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/db";

export async function GET() {
  try {
    const deals = await prisma.deal.findMany({
      orderBy: { createdAt: "desc" },
      include: { contact: true },
    });
    return NextResponse.json(deals);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch deals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, value, stage, contactId, description } = body;
    const deal = await prisma.deal.create({
      data: {
        title,
        value: value ?? 0,
        stage: stage ?? "lead",
        contactId: contactId || null,
        description,
      },
      include: { contact: true },
    });
    return NextResponse.json(deal);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create deal" }, { status: 500 });
  }
}
