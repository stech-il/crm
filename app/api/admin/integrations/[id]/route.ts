import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/lib/auth";
import { encryptJson } from "@/lib/encryption";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "לא מורשה" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  const data: { name?: string; isActive?: boolean; credentials?: string; config?: object } = {};
  if (body.name != null) data.name = body.name;
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (body.config != null) data.config = body.config;
  if (body.credentials != null) data.credentials = encryptJson(body.credentials);

  const updated = await prisma.integration.update({
    where: { id },
    data,
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "לא מורשה" }, { status: 403 });
  }
  const { id } = await params;
  await prisma.integration.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
