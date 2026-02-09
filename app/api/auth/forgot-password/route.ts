import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { randomBytes } from "crypto";
import { sendPasswordResetEmail, isEmailConfigured } from "@/lib/email";
import { sendEmailViaSendGrid } from "@/lib/integrations";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "נא להזין אימייל" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user) {
      return NextResponse.json({ message: "אם האימייל קיים במערכת, נשלח אליו קישור לאיפוס סיסמה." });
    }

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.passwordResetToken.deleteMany({
      where: { email: user.email! },
    });
    await prisma.passwordResetToken.create({
      data: { email: user.email!, token, expiresAt },
    });

    const resetUrl = `${baseUrl}/reset-password?token=${token}`;
    const html = `<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 500px;"><h2>איפוס סיסמה</h2><p>קיבלנו בקשה לאיפוס הסיסמה עבור ${user.email}.</p><p>לחץ על הקישור: <a href="${resetUrl}">${resetUrl}</a></p><p>הקישור תקף ל־24 שעות.</p></div>`;

    let result: { ok: boolean; error?: string };
    if (isEmailConfigured()) {
      result = await sendPasswordResetEmail(user.email!, resetUrl);
    } else {
      const sendgridResult = await sendEmailViaSendGrid({
        to: user.email!,
        subject: "איפוס סיסמה - CRM",
        html,
      });
      result = sendgridResult;
    }

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || "שליחת אימייל לא מוגדרת. ראה הוראות בהמשך." },
        { status: 503 }
      );
    }

    return NextResponse.json({
      message: "אם האימייל קיים במערכת, נשלח אליו קישור לאיפוס סיסמה.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "שגיאה" }, { status: 500 });
  }
}
