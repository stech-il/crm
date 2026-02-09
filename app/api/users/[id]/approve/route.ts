import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "../../../../lib/db";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
    }
    const user = await prisma.user.update({
      where: { id },
      data: { status: "approved" },
    });
    return NextResponse.json({ id: user.id, status: user.status });
  } catch (error) {
    return NextResponse.json({ error: "שגיאה באישור" }, { status: 500 });
  }
}
