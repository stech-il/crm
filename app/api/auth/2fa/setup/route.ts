import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateSecret, getOTPAuthUrl } from "@/lib/totp";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  const email = (session?.user as { email?: string })?.email;
  if (!userId || !email) return NextResponse.json({ error: "לא מאומת" }, { status: 401 });

  const secret = generateSecret();
  const url = getOTPAuthUrl(secret, email);
  return NextResponse.json({ secret, url });
}
