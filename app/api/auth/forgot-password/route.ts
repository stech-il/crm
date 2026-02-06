import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { randomBytes } from "crypto";
import { sendPasswordResetEmail, isEmailConfigured } from "../../../../lib/email";

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

    if (!isEmailConfigured()) {
      return NextResponse.json(
        { error: "שליחת אימייל לא מוגדרת. פנה למנהל המערכת." },
        { status: 503 }
      );
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.passwordResetToken.deleteMany({
      where: { email: user.email! },
    });
    await prisma.passwordResetToken.create({
      data: { email: user.email!, token, expiresAt },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    const result = await sendPasswordResetEmail(user.email!, resetUrl);
    if (!result.ok) {
      return NextResponse.json({ error: result.error || "שגיאה בשליחת אימייל" }, { status: 500 });
    }

    return NextResponse.json({
      message: "אם האימייל קיים במערכת, נשלח אליו קישור לאיפוס סיסמה.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "שגיאה" }, { status: 500 });
  }
}
