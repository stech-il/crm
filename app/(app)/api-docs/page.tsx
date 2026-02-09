"use client";

import Link from "next/link";
import { Book, Key, Webhook, ChevronLeft } from "lucide-react";

export default function ApiDocsPage() {
  const baseUrl = typeof window !== "undefined" ? `${window.location.origin}/api/v1` : "https://your-app.onrender.com/api/v1";

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-800 mb-6">
        <ChevronLeft className="h-4 w-4" /> חזרה
      </Link>

      <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-2">
        <Book className="h-8 w-8" />
        תיעוד API
      </h1>
      <p className="text-slate-600 mb-8">ממשק תכנות יישומים (API) לגישה חיצונית ל-CRM.</p>

      <nav className="mb-12 flex flex-wrap gap-2">
        <a href="#auth" className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">אימות</a>
        <a href="#entities" className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">כרטסאות</a>
        <a href="#records" className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">רשומות</a>
        <a href="#webhooks" className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">Webhooks</a>
        <a href="#import" className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">ייבוא CSV</a>
        <a href="#errors" className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">שגיאות</a>
      </nav>

      <section id="auth" className="mb-12">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Key className="h-5 w-5" />
          אימות
        </h2>
        <p className="text-slate-600 mb-4">הכל בקשות ל-API דורשות מפתח API. יצירת מפתחות תחת <Link href="/admin/api-keys" className="text-primary-600 hover:underline">ניהול → מפתחות API</Link>.</p>
        <div className="rounded-xl bg-slate-900 text-slate-100 p-4 overflow-x-auto">
          <pre className="text-sm">{`Authorization: Bearer crm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`}</pre>
        </div>
        <p className="text-slate-600 mt-4 text-sm">הרשאות: <code className="bg-slate-100 px-1 rounded">records:read</code> (קריאה), <code className="bg-slate-100 px-1 rounded">records:write</code> (כתיבה).</p>
      </section>

      <section id="base" className="mb-12">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Base URL</h2>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <code className="text-primary-600">{baseUrl}</code>
        </div>
      </section>

      <section id="entities" className="mb-12">
        <h2 className="text-xl font-bold text-slate-800 mb-4">כרטסאות</h2>

        <div className="mb-8">
          <h3 className="font-semibold text-slate-700 mb-2">GET /api/v1/entities</h3>
          <p className="text-slate-600 mb-2">רשימת כל הכרטסאות (מודולים) במערכת.</p>
          <div className="rounded-xl bg-slate-900 text-slate-100 p-4 overflow-x-auto mb-2">
            <pre className="text-sm">{`curl -X GET "${baseUrl}/entities" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}</pre>
          </div>
          <div className="rounded-xl border border-slate-200 p-4 bg-white">
            <p className="text-xs text-slate-500 mb-2">תגובה:</p>
            <pre className="text-sm text-slate-700 overflow-x-auto">{`{
  "entities": [
    { "slug": "leads", "name": "לידים" },
    { "slug": "contacts", "name": "אנשי קשר" }
  ]
}`}</pre>
          </div>
        </div>
      </section>

      <section id="records" className="mb-12">
        <h2 className="text-xl font-bold text-slate-800 mb-4">רשומות</h2>

        <div className="mb-8">
          <h3 className="font-semibold text-slate-700 mb-2">GET /api/v1/{`{entitySlug}`}</h3>
          <p className="text-slate-600 mb-2">קבלת רשימת רשומות. פרמטרים: <code className="bg-slate-100 px-1 rounded">search</code>, <code className="bg-slate-100 px-1 rounded">page</code>, <code className="bg-slate-100 px-1 rounded">limit</code>.</p>
          <div className="rounded-xl bg-slate-900 text-slate-100 p-4 overflow-x-auto mb-2">
            <pre className="text-sm">{`curl -X GET "${baseUrl}/leads?search=john&page=1&limit=25" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}</pre>
          </div>
          <div className="rounded-xl border border-slate-200 p-4 bg-white">
            <p className="text-xs text-slate-500 mb-2">תגובה:</p>
            <pre className="text-sm text-slate-700 overflow-x-auto">{`{
  "entity": { "slug": "leads", "name": "לידים" },
  "records": [
    {
      "id": "clx...",
      "data": { "name": "יוחנן", "email": "john@example.com", "status": "new" },
      "createdAt": "2025-02-03T10:00:00.000Z",
      "updatedAt": "2025-02-03T10:00:00.000Z"
    }
  ],
  "total": 42,
  "page": 1,
  "totalPages": 2
}`}</pre>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="font-semibold text-slate-700 mb-2">POST /api/v1/{`{entitySlug}`}</h3>
          <p className="text-slate-600 mb-2">יצירת רשומה חדשה.</p>
          <div className="rounded-xl bg-slate-900 text-slate-100 p-4 overflow-x-auto mb-2">
            <pre className="text-sm">{`curl -X POST "${baseUrl}/leads" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"data": {"name": "ליד חדש", "email": "lead@example.com", "status": "new"}}'`}</pre>
          </div>
          <div className="rounded-xl border border-slate-200 p-4 bg-white">
            <p className="text-xs text-slate-500 mb-2">תגובה:</p>
            <pre className="text-sm text-slate-700 overflow-x-auto">{`{
  "id": "clx...",
  "data": { "name": "ליד חדש", "email": "lead@example.com", "status": "new" },
  "createdAt": "2025-02-03T10:00:00.000Z",
  "updatedAt": "2025-02-03T10:00:00.000Z"
}`}</pre>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="font-semibold text-slate-700 mb-2">GET /api/v1/{`{entitySlug}`}/{`{recordId}`}</h3>
          <p className="text-slate-600 mb-2">קבלת רשומה בודדת לפי ID.</p>
          <div className="rounded-xl bg-slate-900 text-slate-100 p-4 overflow-x-auto mb-2">
            <pre className="text-sm">{`curl -X GET "${baseUrl}/leads/clx123..." \\
  -H "Authorization: Bearer YOUR_API_KEY"`}</pre>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="font-semibold text-slate-700 mb-2">PATCH /api/v1/{`{entitySlug}`}/{`{recordId}`}</h3>
          <p className="text-slate-600 mb-2">עדכון רשומה. גוף: <code className="bg-slate-100 px-1 rounded">{"{ data: {...} }"}</code></p>
          <div className="rounded-xl bg-slate-900 text-slate-100 p-4 overflow-x-auto mb-2">
            <pre className="text-sm">{`curl -X PATCH "${baseUrl}/leads/clx123..." \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"data": {"status": "contacted"}}'`}</pre>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="font-semibold text-slate-700 mb-2">DELETE /api/v1/{`{entitySlug}`}/{`{recordId}`}</h3>
          <p className="text-slate-600 mb-2">ארכוב רשומה (מחיקה רכה – הרשומה לא נמחקת לצמיתות).</p>
          <div className="rounded-xl bg-slate-900 text-slate-100 p-4 overflow-x-auto mb-2">
            <pre className="text-sm">{`curl -X DELETE "${baseUrl}/leads/clx123..." \\
  -H "Authorization: Bearer YOUR_API_KEY"`}</pre>
          </div>
        </div>
      </section>

      <section id="webhooks" className="mb-12">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Webhook className="h-5 w-5" />
          Webhooks
        </h2>
        <p className="text-slate-600 mb-4">הגדרת webhooks תחת <Link href="/admin/webhooks" className="text-primary-600 hover:underline">ניהול → Webhooks</Link>. המערכת שולחת POST ל-URL שלך כשמתרחשים אירועים.</p>

        <h3 className="font-semibold text-slate-700 mb-2">אירועים</h3>
        <ul className="list-disc list-inside text-slate-600 mb-4 space-y-1">
          <li><code className="bg-slate-100 px-1 rounded">record.created</code> – רשומה נוצרה</li>
          <li><code className="bg-slate-100 px-1 rounded">record.updated</code> – רשומה עודכנה</li>
          <li><code className="bg-slate-100 px-1 rounded">record.deleted</code> – רשומה נמחקה לצמיתות</li>
          <li><code className="bg-slate-100 px-1 rounded">record.archived</code> – רשומה נארכבה</li>
        </ul>

        <h3 className="font-semibold text-slate-700 mb-2">פורמט Payload</h3>
        <div className="rounded-xl border border-slate-200 p-4 bg-white mb-4">
          <pre className="text-sm text-slate-700 overflow-x-auto">{`{
  "event": "record.created",
  "timestamp": "2025-02-03T10:00:00.000Z",
  "entitySlug": "leads",
  "recordId": "clx...",
  "data": { "name": "ליד", "email": "a@b.com" },
  "previousData": null
}`}</pre>
        </div>

        <h3 className="font-semibold text-slate-700 mb-2">Headers</h3>
        <ul className="text-slate-600 mb-4 space-y-1">
          <li><code className="bg-slate-100 px-1 rounded">X-Webhook-Event</code> – סוג האירוע</li>
          <li><code className="bg-slate-100 px-1 rounded">X-Webhook-Timestamp</code> – חותמת זמן</li>
          <li><code className="bg-slate-100 px-1 rounded">X-Webhook-Signature</code> – חתימת HMAC-SHA256 (אם הוגדר secret)</li>
        </ul>

        <h3 className="font-semibold text-slate-700 mb-2">אימות חתימה</h3>
        <div className="rounded-xl bg-slate-900 text-slate-100 p-4 overflow-x-auto">
          <pre className="text-sm">{`// Node.js
const crypto = require('crypto');
const signature = crypto
  .createHmac('sha256', YOUR_WEBHOOK_SECRET)
  .update(rawBody)
  .digest('hex');
const expected = 'sha256=' + signature;
// Compare with X-Webhook-Signature header`}</pre>
        </div>
      </section>

      <section id="import" className="mb-12">
        <h2 className="text-xl font-bold text-slate-800 mb-4">ייבוא CSV</h2>
        <p className="text-slate-600 mb-4">מדף רשימת כרטסת, לחץ על "ייבוא CSV" ובחר קובץ. שורת הכותרות צריכה להתאים לשמות השדות או לתוויות (למשל: name, email, סטטוס).</p>
        <div className="rounded-xl border border-slate-200 p-4 bg-white">
          <pre className="text-sm text-slate-700 overflow-x-auto">{`name,email,status,phone
יוחנן,john@example.com,new,050-1234567
מריה,maria@example.com,contacted,052-9876543`}</pre>
        </div>
      </section>

      <section id="errors" className="mb-12">
        <h2 className="text-xl font-bold text-slate-800 mb-4">קודי שגיאה</h2>
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">קוד</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">תיאור</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr><td className="px-4 py-3">200</td><td className="px-4 py-3">הצלחה</td></tr>
              <tr><td className="px-4 py-3">401</td><td className="px-4 py-3">לא מורשה – מפתח API חסר או לא תקין</td></tr>
              <tr><td className="px-4 py-3">403</td><td className="px-4 py-3">אין הרשאה – חסרה הרשאת records:read או records:write</td></tr>
              <tr><td className="px-4 py-3">404</td><td className="px-4 py-3">כרטסת או רשומה לא נמצאו</td></tr>
              <tr><td className="px-4 py-3">429</td><td className="px-4 py-3">Rate limit – יותר מדי בקשות (200 לדקה)</td></tr>
              <tr><td className="px-4 py-3">500</td><td className="px-4 py-3">שגיאת שרת</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-slate-800 mb-4">דוגמה ב-JavaScript</h2>
        <div className="rounded-xl bg-slate-900 text-slate-100 p-4 overflow-x-auto">
          <pre className="text-sm">{`const API_KEY = 'crm_xxxx...';
const BASE = '${baseUrl}';

// רשימת רשומות
const records = await fetch(BASE + '/leads?page=1&limit=25', {
  headers: { 'Authorization': \`Bearer \${API_KEY}\` }
}).then(r => r.json());

// יצירת רשומה
const newRecord = await fetch(BASE + '/leads', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${API_KEY}\`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    data: { name: 'ליד חדש', email: 'test@example.com' }
  })
}).then(r => r.json());`}</pre>
        </div>
      </section>

      <div className="pt-8 border-t border-slate-200 text-center text-slate-500 text-sm">
        CRM API v1 • התיעוד מתעדכן אוטומטית
      </div>
    </div>
  );
}
