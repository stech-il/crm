import { createHmac } from "crypto";

const PERIOD = 30;
const DIGITS = 6;

function base32Decode(secret: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const c of secret.toUpperCase().replace(/=+$/, "")) {
    const i = alphabet.indexOf(c);
    if (i < 0) continue;
    bits += i.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    const chunk = bits.slice(i, i + 8);
    if (chunk.length === 8) bytes.push(parseInt(chunk, 2));
  }
  return Buffer.from(bytes);
}

export function generateSecret(): string {
  const buf = createHmac("sha256", "crm-2fa").update(Date.now().toString()).digest().slice(0, 20);
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let out = "";
  let bits = 0;
  let acc = 0;
  for (const b of buf) {
    acc = (acc << 8) | b;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += alphabet[(acc >>> bits) & 31];
    }
  }
  if (bits > 0) out += alphabet[(acc << (5 - bits)) & 31];
  return out;
}

export function generateTOTP(secret: string): string {
  const key = base32Decode(secret);
  const counter = Math.floor(Date.now() / 1000 / PERIOD);
  const buf = Buffer.allocUnsafe(8);
  buf.writeBigInt64BE(BigInt(counter), 0);
  const hmac = createHmac("sha1", key).update(buf).digest();
  const offset = hmac[19]! & 0x0f;
  const code = ((hmac[offset]! & 0x7f) << 24) | ((hmac[offset + 1]! & 0xff) << 16) | ((hmac[offset + 2]! & 0xff) << 8) | (hmac[offset + 3]! & 0xff);
  return (code % Math.pow(10, DIGITS)).toString().padStart(DIGITS, "0");
}

export function verifyTOTP(secret: string, token: string, window = 1): boolean {
  const normalized = token.replace(/\s/g, "");
  if (!/^\d{6}$/.test(normalized)) return false;
  const counter = Math.floor(Date.now() / 1000 / PERIOD);
  for (let i = -window; i <= window; i++) {
    const key = base32Decode(secret);
    const c = counter + i;
    const buf = Buffer.allocUnsafe(8);
    buf.writeBigInt64BE(BigInt(c), 0);
    const hmac = createHmac("sha1", key).update(buf).digest();
    const offset = hmac[19]! & 0x0f;
    const code = ((hmac[offset]! & 0x7f) << 24) | ((hmac[offset + 1]! & 0xff) << 16) | ((hmac[offset + 2]! & 0xff) << 8) | (hmac[offset + 3]! & 0xff);
    const expected = (code % Math.pow(10, DIGITS)).toString().padStart(DIGITS, "0");
    if (expected === normalized) return true;
  }
  return false;
}

export function getOTPAuthUrl(secret: string, email: string, issuer = "CRM"): string {
  const encoded = encodeURIComponent(`otpauth://totp/${issuer}:${email}?secret=${secret}&issuer=${issuer}&period=${PERIOD}&digits=${DIGITS}`);
  return encoded;
}
