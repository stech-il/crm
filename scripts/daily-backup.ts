/**
 * סקריפט גיבוי יומי - נועד להרצה ע"י Cron Job.
 * שומר את כל הנתונים במודל Backup.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("[Backup] מתחיל גיבוי...");

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
    source: "daily-cron",
    data: { users, entities, fieldDefinitions, records, tasks, callLogs, notes },
  };

  const backup = await prisma.backup.create({
    data: {
      data: backupData as object,
      createdById: null, // גיבוי אוטומטי - ללא משתמש
    },
  });

  console.log(`[Backup] גיבוי הושלם: ${backup.id} ב-${backup.createdAt.toISOString()}`);
}

main()
  .catch((e) => {
    console.error("[Backup] שגיאה:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
