# CRM - מערכת ריקה להתאמה אישית

מערכת CRM מינימלית בענן. **המערכת ריקה** – אתה מגדיר ישויות ושדות בהתאמה אישית דרך לוח הניהול.

## מה כלול

- **התחברות** – הרשמה, התחברות, התנתקות, שכחתי סיסמה
- **לוח ניהול** – יצירת ישויות ושדות דינמיים
- **ישויות דינמיות** – כל ישות עם שדות מותאמים (טקסט, מספר, תאריך, בחירה, קובץ, משתמש ועוד)
- **רשומות** – יצירה, עריכה, צפייה – הכל דינמי לפי ההגדרות

## התקנה מקומית

```bash
npm install

# צור .env עם:
# DATABASE_URL=postgresql://user:password@localhost:5432/crm
# NEXTAUTH_SECRET=מפתח-סודי-ארוך-לפחות-32-תווים
# NEXTAUTH_URL=http://localhost:3000
# CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET (להעלאת קבצים - חינמי ב-cloudinary.com)

npx prisma db push
npm run db:seed
npm run dev
```

פתח [http://localhost:3000](http://localhost:3000)

**משתמש אדמין** (אחרי `npm run db:seed`):
- אימייל: `admin@crm.com` | סיסמה: `123456`

## איך להתחיל

1. התחבר עם המשתמש האדמין
2. עבור ל**ניהול** (לוח הניהול)
3. הוסף **ישות** – למשל "לקוחות", "פרויקטים", "מוצרים"
4. הוסף **שדות** לכל ישות – שם, טלפון, אימייל, תאריך וכו'
5. הישות תופיע בתפריט הצד – תוכל ליצור רשומות בהתאמה אישית

## פריסה ב-Render

- **Build:** `npm install && npx prisma generate && npx prisma db push && npm run build && npm run db:seed`
- **Start:** `cd .next/standalone && node server.js` (עם `output: 'standalone'`)

חשוב: עם `output: 'standalone'` חייבים להריץ את `server.js` מתוך תיקיית standalone, לא `next start`.
- **Environment:** `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `CLOUDINARY_*`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (לשכחתי סיסמה)

**חשוב:** `NEXTAUTH_URL` חייב להיות כתובת האתר בפועל (למשל `https://crm-cloud.onrender.com`). אם הוא מוגדר כ-`http://localhost:3000`, ההתנתקות תפנה ל-localhost במקום למסך החיבור.

**שגיאת "Cannot GET /login":** אם אתה מקבל שגיאה זו, נסה: (1) `npm run build` – וודא שהבנייה מצליחה; (2) וודא שאתה ניגש לכתובת הנכונה (למשל `https://yoursite.com/login` ולא רק `/login` בלי הדומיין).

## העלאת קבצים (Cloudinary)

הקבצים נשמרים בענן של Cloudinary. הרשם חינם ב-[cloudinary.com](https://cloudinary.com), צור Cloud, והעתק את הפרטים ל-.env. בלי הגדרה זו – שדות קובץ יציגו הודעת שגיאה.

## גיבויים ושחזור (אדמין בלבד)

רק מנהלים רואים את תפריט "גיבויים" ויכולים:
- **ליצור גיבוי** – שומר במערכת
- **להוריד** – קובץ JSON
- **לשחזר** – מחליף את כל הנתונים (ישויות, רשומות, משימות, לוג שיחות) מנתוני הגיבוי
- **למחוק** גיבוי

### גיבוי יומי אוטומטי (cron)

הוסף `BACKUP_SECRET` ב-Render. Cron יכול לקרוא ל:
```
POST https://yoursite.com/api/admin/backups
Header: x-backup-secret: המפתח
```
זה יוצר גיבוי חדש ושמור במערכת. האדמין יוכל לראות ולשחזר.
