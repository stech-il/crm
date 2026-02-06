const HEBREW_MONTHS: Record<string, string> = {
  Nisan: "ניסן", Iyyar: "אייר", Sivan: "סיוון", Tammuz: "תמוז", Av: "אב", Elul: "אלול",
  Tishrei: "תשרי", Cheshvan: "חשון", Kislev: "כסלו", Tevet: "טבת", Shvat: "שבט", Adar: "אדר", "Adar I": "אדר א", "Adar II": "אדר ב",
};

const HEBREW_ONES = "אבגדהוזחט";
const HEBREW_TENS = "יכלמנסעפצ";
const HEBREW_HUNDREDS = "קרשת";

/** המרת מספר 1–30 לאותיות עבריות (יום) */
function numToHebrewDay(n: number): string {
  if (n < 1 || n > 30) return String(n);
  if (n === 15) return "ט״ו";
  if (n === 16) return "ט״ז";
  if (n <= 9) return HEBREW_ONES[n - 1]!;
  if (n === 10) return "י";
  if (n < 20) return "י" + HEBREW_ONES[n - 11]!;
  if (n === 20) return "כ";
  if (n < 30) return "כ" + HEBREW_ONES[n - 21]!;
  return "ל";
}

/** המרת שנה עברית (למשל 5785) לאותיות עבריות */
function numToHebrewYear(n: number): string {
  if (n < 5000) return String(n);
  let rest = n - 5000;
  let s = "ה׳";
  const pairs: [number, string][] = [
    [400, "ת"], [300, "ש"], [200, "ר"], [100, "ק"], [90, "צ"], [80, "פ"], [70, "ע"], [60, "ס"],
    [50, "נ"], [40, "מ"], [30, "ל"], [20, "כ"], [10, "י"], [9, "ט"], [8, "ח"], [7, "ז"], [6, "ו"],
    [5, "ה"], [4, "ד"], [3, "ג"], [2, "ב"], [1, "א"],
  ];
  for (const [val, letter] of pairs) {
    while (rest >= val) {
      s += letter;
      rest -= val;
    }
  }
  if (s.length > 2) s = s.slice(0, -1) + "״" + s.slice(-1);
  return s;
}

/**
 * המרת תאריך לועזי לתאריך עברי מלא (אותיות בלבד, בלי מספרים)
 */
function toHebrewDate(dateStr: string): string {
  try {
    const { toJewishDate } = require("jewish-date");
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const j = toJewishDate(d);
    const monthHeb = HEBREW_MONTHS[j.monthName] || j.monthName;
    const dayHeb = numToHebrewDay(j.day);
    const yearHeb = numToHebrewYear(j.year);
    return `${dayHeb} ב${monthHeb} ${yearHeb}`;
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
