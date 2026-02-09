import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/app/lib/db";
import { verifyTOTP } from "@/lib/totp";
import { encryptPlain } from "@/lib/encryption";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "לא מאומת" }, { status: 401 });

  const { secret, code } = await request.json();
  if (!secret || !code) return NextResponse.json({ error: "חסר קוד או מפתח" }, { status: 400 });
  if (!verifyTOTP(secret, code)) return NextResponse.json({ error: "קוד אימות שגוי" }, { status: 400 });

  const encrypted = encryptPlain(secret);
  await prisma.user.update({
    where: { id: userId },
    data: { totpSecret: encrypted },
  });
  return NextResponse.json({ ok: true });
}
