import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();
    if (!token || !password || typeof password !== "string") {
      return NextResponse.json({ error: "נא להזין סיסמה חדשה" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "הסיסמה חייבת להכיל לפחות 6 תווים" }, { status: 400 });
    }

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetRecord || resetRecord.expiresAt < new Date()) {
      return NextResponse.json({ error: "הקישור לא תקף או שפג תוקפו. נסה לבקש איפוס סיסמה מחדש." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.$transaction([
      prisma.user.updateMany({
        where: { email: resetRecord.email },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.delete({ where: { id: resetRecord.id } }),
    ]);

    return NextResponse.json({ message: "הסיסמה עודכנה בהצלחה. תוכל להתחבר כעת." });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "שגיאה" }, { status: 500 });
  }
}
