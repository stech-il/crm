import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import bcrypt from "bcryptjs";

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
    const body = await request.json();
    const { password, ...rest } = body;
    const data: Record<string, unknown> = { ...rest };
    if (password && typeof password === "string" && password.length >= 6) {
      data.password = await bcrypt.hash(password, 10);
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
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "שגיאה במחיקה" }, { status: 500 });
  }
}
