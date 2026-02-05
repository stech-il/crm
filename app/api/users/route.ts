import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/db";
import bcrypt from "bcryptjs";

function excludePassword(user: { id: string; name: string; email: string | null; password: string | null; role: string; image: string | null; createdAt: Date; updatedAt: Date }) {
  const { password: _, ...rest } = user;
  return rest;
}

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, role: true, image: true, createdAt: true, updatedAt: true },
    });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: "שגיאה בטעינת משתמשים" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role } = await request.json();
    if (!name || !email) {
      return NextResponse.json({ error: "נא למלא שם ואימייל" }, { status: 400 });
    }
    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "אימייל כבר קיים" }, { status: 400 });
    }
    const hash = password && password.length >= 6
      ? await bcrypt.hash(password, 10)
      : null;
    const user = await prisma.user.create({
      data: { name, email, password: hash, role: role || "user" },
    });
    return NextResponse.json(excludePassword(user));
  } catch (error) {
    return NextResponse.json({ error: "שגיאה ביצירת משתמש" }, { status: 500 });
  }
}
