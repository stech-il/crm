"use client";

import Link from "next/link";
import { Webhook, Key, Mail, Zap, FileText } from "lucide-react";

export default function IntegrationsPage() {
  const items = [
    {
      title: "API",
      description: "גישה חיצונית לרשומות, כרטיסים וישויות עם מפתח API. מתאים לחיבור למערכות ERP, אתרים ואפליקציות.",
      href: "/api-docs",
      icon: Key,
      adminLink: "/admin/api-keys",
      adminLabel: "מפתחות API",
    },
    {
      title: "Webhooks",
      description: "שליחת אירועים (יצירת/עדכון רשומה) ל-URL שתגדיר. מתאים לאינטגרציה עם Zapier, Make, או שרת משלכם.",
      href: "/admin/webhooks",
      icon: Webhook,
    },
    {
      title: "אימייל",
      description: "המערכת שולחת מיילים לאיפוס סיסמה והתראות. הגדרת SMTP או SendGrid במשתני סביבה.",
      href: "/admin",
      icon: Mail,
    },
    {
      title: "אוטומציות",
      description: "כללים אוטומטיים: בעת עדכון רשומה – יצירת משימה או קריאה ל-URL (webhook).",
      href: "/admin/workflows",
      icon: Zap,
    },
    {
      title: "אינטגרציות (Twilio, SendGrid וכו')",
      description: "חיבור לשירותי SMS, דיוור וכו' דרך לוח הניהול → אינטגרציות.",
      href: "/admin/integrations",
      icon: Zap,
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">ממשקים</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8">
        חיבור ל-API, Webhooks, אימייל ואוטומציות. מתאים להתממשקות עם מערכת ERP, דיוור אלקטרוני וכלים חיצוניים.
      </p>
      <div className="grid gap-6 sm:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-6 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-slate-800 dark:text-slate-100">{item.title}</h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{item.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={item.href}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
                    >
                      <FileText className="h-4 w-4" />
                      לפרטים
                    </Link>
                    {item.adminLink && (
                      <Link
                        href={item.adminLink}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        {item.adminLabel}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
