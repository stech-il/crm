# הגדרת שליחת אימייל

המערכת דורשת הגדרת שליחת אימייל עבור **איפוס סיסמה** (שכחתי סיסמה). יש שתי אפשרויות:

---

## אפשרות 1: SMTP (Gmail, Outlook, וכו')

הוסף את המשתנים הבאים ל־**Environment Variables** ב-Render (או לקובץ `.env` בפיתוח מקומי):

| משתנה | תיאור | דוגמה |
|-------|--------|-------|
| `SMTP_HOST` | שרת SMTP | `smtp.gmail.com` |
| `SMTP_PORT` | פורט (בדרך כלל 587) | `587` |
| `SMTP_USER` | כתובת האימייל | `your-email@gmail.com` |
| `SMTP_PASS` | סיסמה / App Password | סיסמת אפליקציה |
| `SMTP_FROM` | (אופציונלי) כתובת שולח | `noreply@yourdomain.com` |
| `SMTP_SECURE` | (אופציונלי) SSL | `false` |

### Gmail
1. הפעל אימות דו-שלבי בחשבון Google
2. צור **App Password**: [Google Account](https://myaccount.google.com/apppasswords)
3. השתמש ב־App Password ב־`SMTP_PASS`

### Outlook / Office 365
- `SMTP_HOST=smtp.office365.com`
- `SMTP_PORT=587`
- `SMTP_USER` = כתובת האימייל
- `SMTP_PASS` = סיסמת החשבון

---

## אפשרות 2: SendGrid (אינטגרציה)

1. היכנס ל-**ניהול → אינטגרציות**
2. לחץ **הוסף**
3. בחר **SendGrid (אימייל)**
4. הזן:
   - **API Key** – מ-[SendGrid](https://sendgrid.com) (Settings → API Keys)
   - **כתובת שולח** – כתובת אימייל מאומתת ב-SendGrid

---

## בדיקה

לאחר ההגדרה, נסה **שכחתי סיסמה** בדף ההתחברות. אם האימייל נשלח – ההגדרה תקינה.
