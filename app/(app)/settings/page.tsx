"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-2">
        <Link href="/" className="flex items-center gap-1 text-slate-600 hover:text-slate-800">
          <ChevronLeft className="h-4 w-4" /> חזרה
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-8">הגדרות</h1>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm max-w-lg">
        <p className="text-slate-600">אין הגדרות זמינות כרגע.</p>
      </div>
    </div>
  );
}
