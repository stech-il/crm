/**
 * API גיבויים - רק אדמין. רשימת גיבויים ויצירת גיבוי חדש.
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

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "לא מורשה" }, { status: 403 });

  try {
    const backups = await prisma.backup.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, createdAt: true, createdBy: { select: { name: true } } },
    });
    return NextResponse.json(backups);
  } catch {
    return NextResponse.json({ error: "שגיאה" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  const secret = process.env.BACKUP_SECRET;
  const providedSecret = req.headers.get("x-backup-secret");
  const allowedBySecret = !!(secret && providedSecret && providedSecret === secret);
  if (!admin && !allowedBySecret) return NextResponse.json({ error: "לא מורשה" }, { status: 403 });

  try {
    const [users, entities, fieldDefinitions, records, tasks, callLogs, notes] = await Promise.all([
      prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, createdAt: true } }),
      prisma.entity.findMany({ orderBy: { order: "asc" } }),
      prisma.fieldDefinition.findMany({ orderBy: { order: "asc" } }),
      prisma.dynamicRecord.findMany({ include: { createdBy: { select: { name: true } } } }),
      prisma.recordTask.findMany(),
      prisma.callLog.findMany({ include: { createdBy: { select: { name: true } } } }),
      prisma.recordNote.findMany({ include: { createdBy: { select: { name: true } } } }),
    ]);

    const backupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: { users, entities, fieldDefinitions, records, tasks, callLogs, notes },
    };

    const backup = await prisma.backup.create({
      data: {
        data: backupData as object,
        createdById: admin ? (admin.user as { id?: string }).id || null : null,
      },
    });

    return NextResponse.json({ id: backup.id, createdAt: backup.createdAt });
  } catch (error) {
    console.error("Backup create error:", error);
    return NextResponse.json({ error: "שגיאה ביצירת גיבוי" }, { status: 500 });
  }
}
