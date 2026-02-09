import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "לא מורשה" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  const updated = await prisma.workflowRule.update({
    where: { id },
    data: {
      ...(body.name != null && { name: body.name }),
      ...(body.entitySlug != null && { entitySlug: body.entitySlug }),
      ...(body.trigger != null && { trigger: body.trigger }),
      ...(body.condition != null && { condition: body.condition }),
      ...(body.action != null && { action: body.action }),
      ...(body.actionConfig != null && { actionConfig: body.actionConfig }),
      ...(body.isActive != null && { isActive: body.isActive }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "לא מורשה" }, { status: 403 });
  }
  const { id } = await params;
  await prisma.workflowRule.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
