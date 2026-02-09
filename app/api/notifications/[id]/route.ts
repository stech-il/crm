import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/app/lib/db";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "לא מאומת" }, { status: 401 });

  const { id } = await params;
  await prisma.notification.updateMany({
    where: { id, userId },
    data: { readAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
