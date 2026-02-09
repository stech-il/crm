import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/app/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ enabled: false });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { totpSecret: true } });
  return NextResponse.json({ enabled: !!user?.totpSecret });
}
