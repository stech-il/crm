export const FIELD_TYPES = [
  { value: "text", label: "טקסט" },
  { value: "number", label: "מספר" },
  { value: "email", label: "אימייל" },
  { value: "phone", label: "טלפון" },
  { value: "textarea", label: "טקסט חופשי" },
  { value: "select", label: "בחירה מרשימה" },
  { value: "multiselect", label: "בחירה מרובה" },
  { value: "date", label: "תאריך" },
  { value: "datetime", label: "תאריך ושעה" },
  { value: "checkbox", label: "סימון" },
  { value: "file", label: "העלאת קובץ" },
  { value: "url", label: "קישור" },
  { value: "currency", label: "מטבע" },
  { value: "user", label: "משתמש" },
  { value: "relation", label: "קישור לרשומה" },
] as const;

export type FieldType = (typeof FIELD_TYPES)[number]["value"];
