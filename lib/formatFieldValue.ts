const HEBREW_MONTHS: Record<string, string> = {
  Nisan: "ניסן", Iyyar: "אייר", Sivan: "סיוון", Tammuz: "תמוז", Av: "אב", Elul: "אלול",
  Tishrei: "תשרי", Cheshvan: "חשון", Kislev: "כסלו", Tevet: "טבת", Shvat: "שבט", Adar: "אדר", "Adar I": "אדר א", "Adar II": "אדר ב",
};

/**
 * המרת תאריך לועזי לתאריך עברי
 */
function toHebrewDate(dateStr: string): string {
  try {
    const { toJewishDate } = require("jewish-date");
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const j = toJewishDate(d);
    const monthHeb = HEBREW_MONTHS[j.monthName] || j.monthName;
    return `${j.day} ב${monthHeb} ${j.year}`;
  } catch {
    return dateStr;
  }
}

/**
 * מחזיר טקסט להצגה עבור ערך שדה.
 * מטפל בקבצים (אובייקט עם url/name) ובטיפוסים אחרים.
 * @param fieldType - סוג השדה (למשל date-hebrew להמרה לעברי)
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
