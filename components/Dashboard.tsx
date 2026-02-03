"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Settings } from "lucide-react";

export default function Dashboard() {
  const [data, setData] = useState<{ entitiesCount: number; recordsCount: number } | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-slate-200" />
          <div className="h-48 rounded-lg bg-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="mb-8 text-2xl font-bold text-slate-800">ברוך הבא</h1>

      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center justify-center gap-6 text-center">
          <LayoutDashboard className="h-16 w-16 text-slate-300" />
          <div>
            <p className="text-lg text-slate-600">
              המערכת ריקה. התחל ביצירת ישות ראשונה.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {data.entitiesCount === 0
                ? "עבור ללוח הניהול כדי להגדיר ישויות ושדות בהתאמה אישית."
                : `יש לך ${data.entitiesCount} ישויות ו־${data.recordsCount} רשומות.`}
            </p>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 font-medium text-white hover:bg-primary-700"
          >
            <Settings className="h-5 w-5" />
            לוח ניהול
          </Link>
        </div>
      </div>
    </div>
  );
}
