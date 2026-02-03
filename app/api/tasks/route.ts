import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const completed = searchParams.get("completed");
    const customerId = searchParams.get("customerId");

    const where: Record<string, unknown> = {};
    if (completed !== undefined) where.completed = completed === "true";
    if (customerId) where.customerId = customerId;

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { dueDate: "asc" },
      include: { customer: true, assignee: true },
    });
    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const task = await prisma.task.create({
      data: body,
      include: { customer: true, assignee: true },
    });
    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
