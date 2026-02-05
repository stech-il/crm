/**
 * מחזיר טקסט להצגה עבור ערך שדה.
 * מטפל בקבצים (אובייקט עם url/name) ובטיפוסים אחרים.
 */
export function formatFieldValue(value: unknown): string {
  if (value == null || value === "") return "—";
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
 * מחזיר טקסט מתאים לכותרת (מעדיף filename על פני url)
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
 * מחזיר האם הערך הוא קובץ (יש URL להורדה)
 */
export function isFileValue(value: unknown): value is { url: string; filename?: string } {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return typeof obj.url === "string";
}
