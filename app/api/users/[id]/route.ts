import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "../../../lib/db";
import bcrypt from "bcryptjs";

const ADMIN_EMAIL = "admin@crm.com";

function excludePassword(user: { id: string; name: string; email: string | null; password: string | null; role: string; image: string | null; createdAt: Date; updatedAt: Date }) {
  const { password: _, ...rest } = user;
  return rest;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: "משתמש לא נמצא" }, { status: 404 });
    return NextResponse.json(excludePassword(user));
  } catch (error) {
    return NextResponse.json({ error: "שגיאה" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
    }
    const body = await request.json();
    const { password, role, ...rest } = body;
    const data: Record<string, unknown> = { ...rest };
    if (password && typeof password === "string" && password.length >= 6) {
      data.password = await bcrypt.hash(password, 10);
    }
    // לא מאפשרים שינוי תפקיד - רק admin@crm.com אדמין
    const existing = await prisma.user.findUnique({ where: { id }, select: { email: true } });
    if (existing?.email === ADMIN_EMAIL) {
      data.role = "admin"; // שומרים אדמין ל-admin@crm.com
    } else {
      data.role = "user"; // שאר המשתמשים תמיד רגילים
    }
    const user = await prisma.user.update({
      where: { id },
      data,
    });
    return NextResponse.json(excludePassword(user));
  } catch (error) {
    return NextResponse.json({ error: "שגיאה בעדכון" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
    }
    const user = await prisma.user.findUnique({ where: { id }, select: { email: true } });
    if (user?.email === ADMIN_EMAIL) {
      return NextResponse.json({ error: "לא ניתן למחוק את משתמש האדמין" }, { status: 400 });
    }
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "שגיאה במחיקה" }, { status: 500 });
  }
}
