import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const RATE_LIMIT = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 200;

function getClientId(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.ip || "unknown";
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (!path.startsWith("/api/")) return NextResponse.next();

  const clientId = getClientId(request);
  const now = Date.now();
  let entry = RATE_LIMIT.get(clientId);

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    RATE_LIMIT.set(clientId, entry);
  }
  entry.count++;

  if (entry.count > MAX_REQUESTS) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
