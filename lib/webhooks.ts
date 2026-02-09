import crypto from "crypto";
import { prisma } from "@/app/lib/db";

export type WebhookEvent = "record.created" | "record.updated" | "record.deleted" | "record.archived";

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  entitySlug: string;
  recordId: string;
  data?: Record<string, unknown>;
  previousData?: Record<string, unknown>;
}

function signPayload(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export async function triggerWebhooks(
  event: WebhookEvent,
  entitySlug: string,
  recordId: string,
  data?: Record<string, unknown>,
  previousData?: Record<string, unknown>
): Promise<void> {
  const webhooks = await prisma.webhook.findMany({
    where: {
      isActive: true,
      events: { contains: event },
      OR: [{ entitySlug: null }, { entitySlug }],
    },
  });

  for (const wh of webhooks) {
    const events = (() => {
      try {
        return JSON.parse(wh.events) as string[];
      } catch {
        return [];
      }
    })();
    if (!events.includes(event)) continue;

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      entitySlug,
      recordId,
      data,
      previousData,
    };

    const body = JSON.stringify(payload);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Webhook-Event": event,
      "X-Webhook-Timestamp": payload.timestamp,
    };

    if (wh.secret) {
      headers["X-Webhook-Signature"] = `sha256=${signPayload(body, wh.secret)}`;
    }

    try {
      const res = await fetch(wh.url, {
        method: "POST",
        headers,
        body,
      });
      if (!res.ok) {
        console.error(`[Webhook] ${wh.name} ${wh.url} failed: ${res.status}`);
      }
    } catch (err) {
      console.error(`[Webhook] ${wh.name} ${wh.url} error:`, err);
    }
  }
}
