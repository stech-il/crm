import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/app/lib/db";
import { verifyTOTP } from "@/lib/totp";
import { decryptPlain } from "@/lib/encryption";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "לא מאומת" }, { status: 401 });

  const { code } = await request.json();
  if (!code) return NextResponse.json({ error: "נא להזין קוד אימות" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { totpSecret: true } });
  if (!user?.totpSecret) return NextResponse.json({ error: "אימות דו-שלבי לא מופעל" }, { status: 400 });

  let secret: string;
  try {
    secret = decryptPlain(user.totpSecret);
  } catch {
    return NextResponse.json({ error: "שגיאה" }, { status: 500 });
  }
  if (!verifyTOTP(secret, code)) return NextResponse.json({ error: "קוד אימות שגוי" }, { status: 400 });

  await prisma.user.update({
    where: { id: userId },
    data: { totpSecret: null },
  });
  return NextResponse.json({ ok: true });
}
