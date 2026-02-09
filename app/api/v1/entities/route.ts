import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { validateApiKey, hasPermission } from "@/lib/apiKey";

export async function GET(request: Request) {
  const auth = await validateApiKey(request.headers.get("authorization"));
  if (!auth || !hasPermission(auth.permissions, "records:read")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entities = await prisma.entity.findMany({
    orderBy: { order: "asc" },
    select: { slug: true, name: true },
  });
  return NextResponse.json({ entities });
}
