import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/lib/auth";
import { createApiKey } from "@/lib/apiKey";

export async function GET() {
  const session = await getSession();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "לא מורשה" }, { status: 403 });
  }
  const list = await prisma.apiKey.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "לא מורשה" }, { status: 403 });
  }
  const body = await req.json();
  const { name, permissions, expiresAt } = body;
  if (!name) return NextResponse.json({ error: "חסר name" }, { status: 400 });
  const perms = Array.isArray(permissions) ? permissions : ["records:read", "records:write"];
  const result = await createApiKey({
    name,
    permissions: perms,
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
  });
  return NextResponse.json({
    id: result.id,
    key: result.key,
    keyPrefix: result.keyPrefix,
    message: "המפתח מוצג פעם אחת בלבד – שמור אותו במקום בטוח",
  });
}
