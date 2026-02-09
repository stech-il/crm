/**
 * יצירת רשומות פעילות לרשומות
 */
import { prisma } from "@/app/lib/db";

export type ActivityType =
  | "created"
  | "updated"
  | "task_added"
  | "task_done"
  | "task_undone"
  | "call_added"
  | "note_added";

export async function createActivity(
  recordId: string,
  type: ActivityType,
  content: string | null,
  createdById: string | null
) {
  await prisma.dynamicActivity.create({
    data: { recordId, type, content, createdById },
  });
}
