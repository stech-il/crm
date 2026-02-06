import nodemailer from "nodemailer";

const transporter =
  process.env.SMTP_HOST && process.env.SMTP_USER
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587", 10),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    : null;

export function isEmailConfigured(): boolean {
  return !!transporter;
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<{ ok: boolean; error?: string }> {
  if (!transporter) {
    return { ok: false, error: "שליחת אימייל לא מוגדרת. הוסף SMTP_HOST, SMTP_USER, SMTP_PASS ל-.env" };
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@crm.local";
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  try {
    await transporter.sendMail({
      from,
      to,
      subject: "איפוס סיסמה - CRM",
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 500px;">
          <h2>איפוס סיסמה</h2>
          <p>קיבלנו בקשה לאיפוס הסיסמה עבור ${to}.</p>
          <p>לחץ על הקישור הבא כדי להגדיר סיסמה חדשה:</p>
          <p><a href="${resetUrl}" style="color: #2563eb; font-weight: bold;">${resetUrl}</a></p>
          <p>הקישור תקף ל־24 שעות.</p>
          <p>אם לא ביקשת איפוס סיסמה, התעלם מאימייל זה.</p>
        </div>
      `,
    });
    return { ok: true };
  } catch (err) {
    console.error("Email send error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "שגיאה בשליחת אימייל",
    };
  }
}
