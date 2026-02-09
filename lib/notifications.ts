import { prisma } from "@/app/lib/db";

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  body?: string | null,
  link?: string | null
) {
  await prisma.notification.create({
    data: { userId, type, title, body: body ?? null, link: link ?? null },
  });
}
