import { prisma } from "@/app/lib/db";
import { createNotification } from "@/lib/notifications";

export async function notifyRecordWatchers(
  recordId: string,
  entitySlug: string,
  entityName: string,
  title: string,
  body?: string
) {
  const watchers = await prisma.recordWatcher.findMany({
    where: { recordId },
    select: { userId: true },
  });
  const link = `/dynamic/${entitySlug}/${recordId}`;
  for (const w of watchers) {
    await createNotification(w.userId, "assignment", title, body || null, link);
  }
}
