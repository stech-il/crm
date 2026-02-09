import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "לא מורשה" }, { status: 403 });
  }
  const list = await prisma.workflowRule.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "לא מורשה" }, { status: 403 });
  }
  const body = await req.json();
  const { name, entitySlug, trigger, condition, action, actionConfig, isActive } = body;
  if (!name || !entitySlug || !trigger || !action) {
    return NextResponse.json({ error: "חסרים שדות: name, entitySlug, trigger, action" }, { status: 400 });
  }
  const created = await prisma.workflowRule.create({
    data: {
      name,
      entitySlug,
      trigger: trigger as string,
      condition: condition ?? null,
      action: action as string,
      actionConfig: actionConfig ?? null,
      isActive: isActive !== false,
    },
  });
  return NextResponse.json(created);
}
