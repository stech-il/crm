import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

async function verifyTask(recordId: string, taskId: string) {
  const task = await prisma.recordTask.findFirst({
    where: { id: taskId, recordId },
  });
  return !!task;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ entitySlug: string; id: string; taskId: string }> }
) {
  const { id, taskId } = await params;
  try {
    if (!(await verifyTask(id, taskId))) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const body = await req.json();
    const task = await prisma.recordTask.update({
      where: { id: taskId },
      data: { done: body.done },
    });
    return NextResponse.json(task);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ entitySlug: string; id: string; taskId: string }> }
) {
  const { id, taskId } = await params;
  try {
    if (!(await verifyTask(id, taskId))) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.recordTask.delete({ where: { id: taskId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
