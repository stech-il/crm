"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Settings, Database, RotateCcw, Zap, Webhook, FileText, Key, Users, ListChecks, Megaphone, Plug } from "lucide-react";

export default function AdminPanel() {
  const [backupCreating, setBackupCreating] = useState(false);
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string })?.role === "admin";

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          <Settings className="inline h-8 w-8 ml-2" />
          ניהול מערכת
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          גישה להגדרות מערכת, גיבויים, אינטגרציות ואוטומציות.
        </p>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {isAdmin && (
          <>
            <Link
              href="/admin/users"
              className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <Users className="h-4 w-4" />
              משתמשים
            </Link>
            <Link
              href="/admin/backups"
              className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <Database className="h-4 w-4" />
              גיבויים
            </Link>
            <Link
              href="/admin/integrations"
              className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <Zap className="h-4 w-4" />
              אינטגרציות
            </Link>
            <Link
              href="/admin/webhooks"
              className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <Webhook className="h-4 w-4" />
              Webhooks
            </Link>
            <Link
              href="/admin/workflows"
              className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <ListChecks className="h-4 w-4" />
              אוטומציות
            </Link>
            <Link
              href="/admin/audit"
              className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <FileText className="h-4 w-4" />
              לוג פעולות
            </Link>
            <Link
              href="/admin/api-keys"
              className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <Key className="h-4 w-4" />
              מפתחות API
            </Link>
            <Link
              href="/admin/campaigns"
              className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <Megaphone className="h-4 w-4" />
              קמפיינים
            </Link>
            <Link
              href="/integrations"
              className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <Plug className="h-4 w-4" />
              ממשקים
            </Link>
          </>
        )}
      </div>

      {isAdmin && (
        <div className="mb-6 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">גיבוי בשרת ושחזור</h2>
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
            צור גיבוי ששומר בשרת, הורד גיבויים קיימים, או שחזר לנתונים מגיבוי קודם.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={async () => {
                setBackupCreating(true);
                try {
                  const res = await fetch("/api/admin/backups", { method: "POST" });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || "שגיאה");
                  alert("הגיבוי נוצר בהצלחה");
                } catch (err) {
                  alert(err instanceof Error ? err.message : "שגיאה");
                } finally {
                  setBackupCreating(false);
                }
              }}
              disabled={backupCreating}
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              <Database className="h-4 w-4" />
              {backupCreating ? "יוצר גיבוי..." : "גיבוי בשרת"}
            </button>
            <Link
              href="/admin/backups"
              className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <RotateCcw className="h-4 w-4" />
              גיבויים ושחזור
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
