import { prisma } from "@/app/lib/db";
import { encryptJson, decryptJson } from "@/lib/encryption";

export type IntegrationType = "twilio" | "sendgrid" | "webhook" | "slack" | "zapier";

export interface IntegrationCredentials {
  [key: string]: string;
}

export async function getIntegration(type: IntegrationType, name?: string) {
  const where: { type: string; isActive?: boolean; name?: string } = { type, isActive: true };
  if (name) where.name = name;
  const raw = await prisma.integration.findFirst({ where });
  if (!raw) return null;
  try {
    const credentials = decryptJson<IntegrationCredentials>(String(raw.credentials ?? "{}"));
    return { ...raw, credentials, config: (raw.config as object) || {} };
  } catch {
    return null;
  }
}

export async function logIntegration(
  integrationId: string,
  action: string,
  status: "success" | "error",
  details?: object
) {
  await prisma.integrationLog.create({
    data: { integrationId, action, status, details: details ? JSON.parse(JSON.stringify(details)) : null },
  });
}

/** שליחת SMS דרך Twilio */
export async function sendSms(to: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const cfg = await getIntegration("twilio");
  if (!cfg?.credentials?.accountSid || !cfg.credentials.authToken) {
    return { ok: false, error: "Twilio לא מוגדר" };
  }
  const from = (cfg.config as { from?: string })?.from || (cfg.credentials as { from?: string })?.from;
  if (!from) return { ok: false, error: "חסר מספר שולח" };

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${cfg.credentials.accountSid}/Messages.json`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${cfg.credentials.accountSid}:${cfg.credentials.authToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: to.replace(/^0/, "+972"),
        From: from,
        Body: body,
      }),
    });
    const data = await res.json();
    await logIntegration(cfg.id, "send_sms", res.ok ? "success" : "error", { to, status: res.status, data });
    if (!res.ok) return { ok: false, error: data.message || String(res.status) };
    return { ok: true };
  } catch (err) {
    await logIntegration(cfg.id, "send_sms", "error", { to, error: String(err) });
    return { ok: false, error: err instanceof Error ? err.message : "שגיאה" };
  }
}

/** שליחת אימייל דרך SendGrid */
export async function sendEmailViaSendGrid(params: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const cfg = await getIntegration("sendgrid");
  if (!cfg?.credentials?.apiKey) {
    return { ok: false, error: "SendGrid לא מוגדר" };
  }
  const from = params.from || (cfg.config as { from?: string }).from || "noreply@crm.local";

  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.credentials.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: params.to }] }],
        from: { email: from, name: "CRM" },
        subject: params.subject,
        content: [{ type: "text/html", value: params.html }],
      }),
    });
    await logIntegration(cfg.id, "send_email", res.ok ? "success" : "error", {
      to: params.to,
      status: res.status,
    });
    if (!res.ok) {
      const txt = await res.text();
      return { ok: false, error: txt || String(res.status) };
    }
    return { ok: true };
  } catch (err) {
    await logIntegration(cfg.id, "send_email", "error", { to: params.to, error: String(err) });
    return { ok: false, error: err instanceof Error ? err.message : "שגיאה" };
  }
}

/** קריאה ל-Webhook חיצוני (כללי) */
export async function callWebhook(url: string, payload: object, headers?: Record<string, string>): Promise<{ ok: boolean; error?: string }> {
  const cfg = await getIntegration("webhook");
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(payload),
    });
    if (cfg) await logIntegration(cfg.id, "webhook_call", res.ok ? "success" : "error", { url, status: res.status });
    return res.ok ? { ok: true } : { ok: false, error: `HTTP ${res.status}` };
  } catch (err) {
    if (cfg) await logIntegration(cfg.id, "webhook_call", "error", { url, error: String(err) });
    return { ok: false, error: err instanceof Error ? err.message : "שגיאה" };
  }
}
