import { NextResponse } from "next/server";
import { prisma } from "../../lib/db";

export async function GET() {
  try {
    const [customersCount, certificationsCount, tasksCount, openTasksCount, dealsResult] = await Promise.all([
      prisma.customer.count().catch(() => 0),
      prisma.certification.count().catch(() => 0),
      prisma.task.count().catch(() => 0),
      prisma.task.count({ where: { completed: false } }).catch(() => 0),
      prisma.deal.aggregate({ _sum: { value: true }, where: { stage: { notIn: ["closed_lost"] } } }).catch(() => ({ _sum: { value: 0 } })),
    ]);

    return NextResponse.json({
      customersCount,
      certificationsCount,
      tasksCount,
      openTasksCount,
      contactsCount: customersCount,
      dealsCount: await prisma.deal.count().catch(() => 0),
      totalValue: dealsResult._sum.value ?? 0,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch dashboard" }, { status: 500 });
  }
}
