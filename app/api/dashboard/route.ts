import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const [contactsCount, dealsCount, totalValue, dealsByStage] = await Promise.all([
      prisma.contact.count(),
      prisma.deal.count(),
      prisma.deal.aggregate({
        _sum: { value: true },
        where: { stage: { notIn: ["closed_lost"] } },
      }),
      prisma.deal.groupBy({
        by: ["stage"],
        _count: true,
        _sum: { value: true },
      }),
    ]);

    return NextResponse.json({
      contactsCount,
      dealsCount,
      totalValue: totalValue._sum.value ?? 0,
      dealsByStage: dealsByStage.reduce(
        (acc, s) => ({ ...acc, [s.stage]: { count: s._count, value: s._sum.value ?? 0 } }),
        {} as Record<string, { count: number; value: number }>
      ),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch dashboard" }, { status: 500 });
  }
}
