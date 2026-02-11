import { toJewishDate, formatJewishDateInHebrew } from "jewish-date";

/**
 * Parse date string (YYYY-MM-DD or ISO) as local date to avoid timezone day shift
 */
function parseDateLocal(dateStr: string): Date | null {
  const s = String(dateStr).trim();
  const onlyDate = /^\d{4}-\d{2}-\d{2}$/.test(s);
  if (onlyDate) {
    const parts = s.split("-").map(Number);
    const y = parts[0], m = parts[1], d = parts[2];
    if (y != null && m != null && d != null) return new Date(y, m - 1, d);
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Convert Gregorian date string to Hebrew date for display (using jewish-date)
 */
function toHebrewDate(dateStr: string): string {
  try {
    const d = parseDateLocal(dateStr);
    if (!d) return dateStr;
    const j = toJewishDate(d);
    return formatJewishDateInHebrew(j) || dateStr;
  } catch {
    return dateStr;
  }
}

/**
 * Format field value for display. Handles files (object with url/name) and other types.
 * @param fieldType - e.g. date-hebrew for Hebrew date conversion
 */
export function formatFieldValue(value: unknown, fieldType?: string): string {
  if (value == null || value === "") return "—";
  if (fieldType === "date-hebrew" && typeof value === "string") {
    return toHebrewDate(value) || value;
  }
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    if (typeof obj.url === "string") return obj.url;
    if (typeof obj.filename === "string") return obj.filename;
    if (typeof obj.name === "string") return obj.name;
  }
  return "—";
}

/**
 * Format value for title (prefers filename over url)
 */
export function formatFieldValueForTitle(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    if (typeof obj.filename === "string") return obj.filename;
    if (typeof obj.name === "string") return obj.name;
  }
  const s = formatFieldValue(value);
  return s === "—" ? "" : s;
}

/**
 * Check if value is a file (has URL for download)
 */
export function isFileValue(value: unknown): value is { url: string; filename?: string } {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return typeof obj.url === "string";
}
