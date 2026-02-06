/**
 * API ליצירת לוג שיחה - לחיבור עתידי למערכת טלפונית.
 * המערכת הטלפונית תשלח POST עם: phoneNumber, direction, duration
 * ואז ניתן לקרוא ל-/api/calls/link כדי לקשר לרשומה לפי מספר הטלפון.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const body = await req.json();
    const { phoneNumber, direction, duration, notes, recordId } = body;
    if (!phoneNumber || typeof phoneNumber !== "string") {
      return NextResponse.json({ error: "נא להזין מספר טלפון" }, { status: 400 });
    }
    const call = await prisma.callLog.create({
      data: {
        phoneNumber: phoneNumber.trim(),
        direction: direction || "incoming",
        duration: typeof duration === "number" ? duration : null,
        notes: typeof notes === "string" ? notes : null,
        recordId: recordId || null,
        createdById: (session?.user as { id?: string })?.id || null,
      },
    });
    return NextResponse.json(call);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
