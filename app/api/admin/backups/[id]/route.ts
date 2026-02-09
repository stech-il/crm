/**
 * API גיבוי בודד - הורדה (רק אדמין)
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/lib/auth";

async function requireAdmin() {
  const session = await getSession();
  if (!session?.user) return null;
  const user = await prisma.user.findUnique({
    where: { id: (session.user as { id?: string }).id },
    select: { role: true },
  });
  return user?.role === "admin" ? session : null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "לא מורשה" }, { status: 403 });

  const { id } = await params;
  try {
    const backup = await prisma.backup.findUnique({ where: { id } });
    if (!backup) return NextResponse.json({ error: "גיבוי לא נמצא" }, { status: 404 });

    const dateStr = new Date(backup.createdAt).toISOString().slice(0, 10);
    return new NextResponse(JSON.stringify(backup.data, null, 0), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="crm-backup-${dateStr}.json"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "שגיאה" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "לא מורשה" }, { status: 403 });

  const { id } = await params;
  try {
    await prisma.backup.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "שגיאה" }, { status: 500 });
  }
}
