/**
 * API לחיבור לוג שיחה לרשומה לפי מספר טלפון.
 * מיועד לחיבור עתידי למערכת טלפונית - מזהה לקוח לפי מספר ומעדכן את הלוג.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { callLogId, phoneNumber, entitySlug } = await req.json();
    if (!callLogId || !phoneNumber) {
      return NextResponse.json({ error: "חסרים פרטים" }, { status: 400 });
    }
    // חיפוש רשומה עם מספר הטלפון ב-data
    const entities = entitySlug
      ? await prisma.entity.findMany({ where: { slug: entitySlug } })
      : await prisma.entity.findMany();
    const phoneStr = String(phoneNumber).replace(/\D/g, "");
    let recordId: string | null = null;
    for (const entity of entities) {
      const records = await prisma.dynamicRecord.findMany({
        where: { entityId: entity.id },
      });
      for (const r of records) {
        const data = r.data as Record<string, unknown>;
        for (const v of Object.values(data)) {
          const s = String(v ?? "").replace(/\D/g, "");
          if (s && phoneStr && (s.includes(phoneStr) || phoneStr.includes(s))) {
            recordId = r.id;
            break;
          }
        }
        if (recordId) break;
      }
      if (recordId) break;
    }
    if (recordId) {
      await prisma.callLog.update({
        where: { id: callLogId },
        data: { recordId },
      });
    }
    return NextResponse.json({ linked: !!recordId, recordId });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
