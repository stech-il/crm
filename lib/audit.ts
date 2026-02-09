import { prisma } from "@/app/lib/db";

export type AuditAction =
  | "record.create"
  | "record.update"
  | "record.delete"
  | "record.archive"
  | "record.restore"
  | "user.login"
  | "user.logout"
  | "integration.create"
  | "integration.update"
  | "integration.delete"
  | "webhook.create"
  | "webhook.update"
  | "webhook.delete";

export async function logAudit(params: {
  userId?: string;
  userEmail?: string;
  action: AuditAction;
  entitySlug?: string;
  recordId?: string;
  details?: object;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        userEmail: params.userEmail ?? null,
        action: params.action,
        entitySlug: params.entitySlug ?? null,
        recordId: params.recordId ?? null,
        details: params.details ? JSON.parse(JSON.stringify(params.details)) : null,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
      },
    });
  } catch (err) {
    console.error("[Audit] failed to log:", err);
  }
}
