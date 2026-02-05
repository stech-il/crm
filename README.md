# CRM - מערכת ריקה להתאמה אישית

מערכת CRM מינימלית בענן. **המערכת ריקה** – אתה מגדיר ישויות ושדות בהתאמה אישית דרך לוח הניהול.

## מה כלול

- **התחברות** – הרשמה, התחברות, התנתקות
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

- **Build:** `npm install && npx prisma generate && npm run build`
- **Start:** `npx prisma db push && npm start`
- **Environment:** `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

## העלאת קבצים (Cloudinary)

הקבצים נשמרים בענן של Cloudinary. הרשם חינם ב-[cloudinary.com](https://cloudinary.com), צור Cloud, והעתק את הפרטים ל-.env. בלי הגדרה זו – שדות קובץ יציגו הודעת שגיאה.

## טכנולוגיות

- Next.js 14, Prisma, PostgreSQL, Tailwind CSS, NextAuth
