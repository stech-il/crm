# CRM Cloud - מערכת CRM בענן

מערכת CRM מלאה בענן, מותאמת לפריסה ב-Render.

## פיצ'רים

- **התחברות משתמשים** - הרשמה, התחברות, התנתקות
- **לוח בקרה** - סטטיסטיקות, לקוחות, אישורי כשרות, משימות
- **לקוחות** - רשימה, טפסים מורחבים, תצוגות שמורות
- **אישורי כשרות** - ניהול אישורים למוצרים
- **משימות, הזמנות, מוצרים** - מודולים מלאים

## התקנה מקומית

```bash
# התקנת תלויות
npm install

# יצירת קובץ .env עם:
# DATABASE_URL=postgresql://user:password@localhost:5432/crm
# NEXTAUTH_SECRET=מפתח-סודי-ארוך-לפחות-32-תווים
# NEXTAUTH_URL=http://localhost:3000

# יצירת טבלאות במסד הנתונים
npx prisma db push

# (אופציונלי) הוספת נתוני דמו
npm run db:seed

# הרצה בפיתוח
npm run dev
```

פתח [http://localhost:3000](http://localhost:3000)

**משתמשי דמו** (אחרי `npm run db:seed`):
- אימייל: `admin@crm.com` | סיסמה: `123456`
- אימייל: `eliezer@example.com` | סיסמה: `123456`

## פריסה ב-Render

### אופציה 1: Blueprint (render.yaml)

1. העלה את הפרויקט ל-GitHub
2. ב-Render: **New** → **Blueprint**
3. חבר את ה-repo - Render יקרא את `render.yaml` ויצור:
   - Web Service (האפליקציה)
   - PostgreSQL (מסד הנתונים)

### אופציה 2: ידנית

1. **יצירת PostgreSQL:**
   - New → PostgreSQL
   - העתק את ה-Connection String

2. **יצירת Web Service:**
   - New → Web Service
   - חבר את ה-repo
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `npx prisma db push && npm start`
   - **Environment:** הוסף:
     - `DATABASE_URL` - Connection String מ-PostgreSQL
     - `NEXTAUTH_SECRET` - מפתח סודי (לפחות 32 תווים)
     - `NEXTAUTH_URL` - כתובת האתר (למשל https://your-app.onrender.com)

## מבנה הפרויקט

```
├── app/
│   ├── api/          # API routes
│   ├── contacts/     # דף אנשי קשר
│   ├── deals/        # דף עסקאות
│   └── page.tsx      # לוח בקרה
├── components/
├── lib/
│   └── db.ts         # Prisma client
├── prisma/
│   └── schema.prisma # מודלים
└── render.yaml       # הגדרות Render
```

## טכנולוגיות

- **Next.js 14** - Full-stack React
- **Prisma** - ORM ל-PostgreSQL
- **Tailwind CSS** - עיצוב
- **Render** - Hosting
