import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createActivity } from "@/lib/activity";
import { prisma } from "@/app/lib/db";
import type { ActivityType } from "@/lib/activity";

const INTERACTION_TYPES: ActivityType[] = ["meeting", "email_sent", "message"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ entitySlug: string; id: string }> }
) {
  const { id: recordId } = await params;
  const session = await getSession();
  const createdById = (session?.user as { id?: string })?.id ?? null;
  const body = await req.json();
  const { type, content } = body as { type: string; content?: string };
  if (!type || !INTERACTION_TYPES.includes(type as ActivityType)) {
    return NextResponse.json({ error: "סוג לא תקין. אפשרויות: meeting, email_sent, message" }, { status: 400 });
  }
  const record = await prisma.dynamicRecord.findUnique({ where: { id: recordId } });
  if (!record) return NextResponse.json({ error: "רשומה לא נמצאה" }, { status: 404 });
  await createActivity(recordId, type as ActivityType, (content || "").trim() || null, createdById);
  return NextResponse.json({ ok: true });
}
