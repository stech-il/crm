import crypto from "crypto";
import { prisma } from "@/app/lib/db";

const HASH_ALG = "sha256";

export function hashApiKey(key: string): string {
  return crypto.createHash(HASH_ALG).update(key).digest("hex");
}

export function keyPrefix(key: string): string {
  return key.slice(0, 6);
}

/** יוצר מפתח API חדש - המפתח עצמו מוחזר פעם אחת */
export async function createApiKey(params: {
  name: string;
  permissions: string[];
  expiresAt?: Date;
}): Promise<{ id: string; key: string; keyPrefix: string }> {
  const rawKey = `crm_${crypto.randomBytes(24).toString("hex")}`;
  const keyHash = hashApiKey(rawKey);
  const prefix = keyPrefix(rawKey);

  const created = await prisma.apiKey.create({
    data: {
      name: params.name,
      keyHash,
      keyPrefix: prefix,
      permissions: JSON.stringify(params.permissions),
      expiresAt: params.expiresAt ?? null,
    },
  });

  return { id: created.id, key: rawKey, keyPrefix: prefix };
}

export async function validateApiKey(
  authHeader: string | null
): Promise<{ keyId: string; permissions: string[] } | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const rawKey = authHeader.slice(7).trim();
  if (!rawKey.startsWith("crm_")) return null;

  const keyHash = hashApiKey(rawKey);

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
  });
  if (!apiKey) return null;
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  const permissions = (() => {
    try {
      return JSON.parse(apiKey.permissions) as string[];
    } catch {
      return [];
    }
  })();

  return { keyId: apiKey.id, permissions };
}

export function hasPermission(permissions: string[], required: string): boolean {
  if (permissions.includes("*")) return true;
  const [resource, action] = required.split(":");
  return permissions.includes(required) || permissions.includes(`${resource}:*`);
}
