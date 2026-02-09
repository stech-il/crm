/**
 * API גיבוי - מייצא את כל הנתונים כ-JSON.
 * אימות: (1) אדמין מחובר, או (2) BACKUP_SECRET ב-query/header (לצורך cron יומי)
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    const secret = process.env.BACKUP_SECRET;
    const providedSecret = req.nextUrl.searchParams.get("secret") || req.headers.get("x-backup-secret");

    let isAdmin = false;
    if (session?.user) {
      const userId = (session.user as { id?: string }).id;
      const userEmail = session.user.email;
      const user = userId
        ? await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
        : userEmail
          ? await prisma.user.findFirst({ where: { email: userEmail }, select: { role: true } })
          : null;
      isAdmin = user?.role === "admin";
    }

    const allowedBySecret = !!(secret && providedSecret && providedSecret === secret);
    if (!isAdmin && !allowedBySecret) {
      if (session && !isAdmin) {
        return NextResponse.json({ error: "Admin only" }, { status: 403 });
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [users, entities, fieldDefinitions, records, tasks, callLogs, passwordResetTokens] =
      await Promise.all([
        prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, createdAt: true } }),
        prisma.entity.findMany({ orderBy: { order: "asc" } }),
        prisma.fieldDefinition.findMany({ orderBy: { order: "asc" } }),
        prisma.dynamicRecord.findMany({ include: { createdBy: { select: { name: true } } } }),
        prisma.recordTask.findMany(),
        prisma.callLog.findMany({ include: { createdBy: { select: { name: true } } } }),
        prisma.passwordResetToken.findMany(),
      ]);

    const backup = {
      version: 1,
      createdAt: new Date().toISOString(),
      data: {
        users,
        entities,
        fieldDefinitions,
        records,
        tasks,
        callLogs,
        passwordResetTokens,
      },
    };

    return new NextResponse(JSON.stringify(backup, null, 0), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="crm-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error) {
    console.error("Backup error:", error);
    return NextResponse.json({ error: "Backup failed" }, { status: 500 });
  }
}
