import crypto from "crypto";

const ALG = "aes-256-gcm";
const IV_LEN = 16;
const TAG_LEN = 16;
const KEY_LEN = 32;

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || process.env.SECRET || "crm-default-key-change-me";
  return crypto.createHash("sha256").update(secret).digest().slice(0, KEY_LEN);
}

export function encryptPlain(text: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALG, key, iv);
  const enc = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptPlain(encrypted: string): string {
  const key = getKey();
  const buf = Buffer.from(encrypted, "base64");
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const enc = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = crypto.createDecipheriv(ALG, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(enc).toString("utf8") + decipher.final("utf8");
}

export function encryptJson(obj: object): string {
  return encryptPlain(JSON.stringify(obj));
}

export function decryptJson<T = object>(encrypted: string): T {
  return JSON.parse(decryptPlain(encrypted)) as T;
}
