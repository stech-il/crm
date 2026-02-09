"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { LayoutDashboard, Settings, Plus, ArrowLeft, Users, FileText, AlertCircle, Activity } from "lucide-react";
import { getEntityIcon } from "../lib/entityIcons";
import { usePolling } from "../lib/usePolling";

type EntitySummary = {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  recordsCount: number;
};

type OverdueTask = { id: string; title: string; dueDate: string | null; recordId: string; entitySlug?: string; entityName?: string };

type ActivityItem = { id: string; type: string; label: string; content: string | null; createdAt: string; recordId: string; entitySlug?: string; entityName?: string; createdBy?: string };

type DashboardData = {
  entitiesCount: number;
  recordsCount: number;
  overdueTasksCount?: number;
  overdueTasks?: OverdueTask[];
  recentActivity?: ActivityItem[];
  entities: EntitySummary[];
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  const fetchData = useCallback(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData);
  }, []);

  useEffect(() => fetchData(), []);
  usePolling(fetchData);

  if (!data) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-slate-200" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-slate-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const hasEntities = data.entitiesCount > 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">לוח בקרה</h1>
        <p className="mt-1 text-slate-600">ברוך הבא למערכת CRM</p>
      </div>

      {hasEntities ? (
        <>
          {/* כרטיסי סטטיסטיקה */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                  <LayoutDashboard className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">ישויות</p>
                  <p className="text-2xl font-bold text-slate-800">{data.entitiesCount}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">סה״כ רשומות</p>
                  <p className="text-2xl font-bold text-slate-800">{data.recordsCount}</p>
                </div>
              </div>
            </div>
            {(data.overdueTasksCount ?? 0) > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-700">משימות באיחור</p>
                    <p className="text-2xl font-bold text-amber-800">{data.overdueTasksCount}</p>
                  </div>
                </div>
                <div className="mt-3 space-y-1 max-h-32 overflow-y-auto">
                  {data.overdueTasks?.slice(0, 5).map((t) => (
                    <Link
                      key={t.id}
                      href={t.entitySlug ? `/dynamic/${t.entitySlug}/${t.recordId}` : "#"}
                      className="block text-sm text-amber-800 hover:underline truncate"
                    >
                      {t.title} {t.entityName && `– ${t.entityName}`}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <Link
              href="/admin"
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-colors hover:border-primary-200 hover:bg-primary-50/50"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Settings className="h-6 w-6" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-500">לוח ניהול</p>
                <p className="text-lg font-semibold text-primary-600">הגדרות מערכת</p>
              </div>
            </Link>
          </div>

          {/* פעילות אחרונה */}
          {(data.recentActivity?.length ?? 0) > 0 && (
            <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Activity className="h-5 w-5" />
                פעילות אחרונה
              </h2>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {data.recentActivity?.slice(0, 10).map((a) => (
                  <Link
                    key={a.id}
                    href={a.entitySlug ? `/dynamic/${a.entitySlug}/${a.recordId}` : "#"}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-50"
                  >
                    <span className="text-slate-500 shrink-0">{a.label}</span>
                    <span className="text-slate-700 truncate flex-1">{a.content || a.entityName || a.recordId?.slice(0, 8)}</span>
                    <span className="text-xs text-slate-400 shrink-0">{new Date(a.createdAt).toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" })}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* גרף רשומות לפי ישות */}
          {data.entities.length > 0 && (
            <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-800">רשומות לפי ישות</h2>
              <div className="space-y-2">
                {data.entities.map((e) => {
                  const max = Math.max(...data.entities.map((x) => x.recordsCount), 1);
                  const pct = (e.recordsCount / max) * 100;
                  return (
                    <div key={e.id} className="flex items-center gap-3">
                      <span className="w-24 text-sm text-slate-600 truncate">{e.name}</span>
                      <div className="flex-1 h-6 bg-slate-100 rounded overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 text-sm font-medium text-slate-700">{e.recordsCount}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* כרטיסי ישויות */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-slate-800">גישה מהירה</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.entities.map((entity) => {
                const Icon = getEntityIcon(entity.icon);
                return (
                  <Link
                    key={entity.id}
                    href={`/dynamic/${entity.slug}`}
                    className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-primary-200 hover:shadow-md"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-colors group-hover:bg-primary-100">
                      <Icon className="h-7 w-7" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800 group-hover:text-primary-600">
                        {entity.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {entity.recordsCount} רשומות
                      </p>
                    </div>
                    <ArrowLeft className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-primary-500" />
                  </Link>
                );
              })}
              <Link
                href="/admin"
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-slate-500 transition-colors hover:border-primary-300 hover:bg-primary-50/30 hover:text-primary-600"
              >
                <Plus className="h-6 w-6" />
                <span className="font-medium">הוסף ישות</span>
              </Link>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-12 shadow-sm">
          <div className="flex flex-col items-center justify-center gap-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100">
              <Users className="h-10 w-10 text-slate-400" />
            </div>
            <div>
              <p className="text-lg font-medium text-slate-700">המערכת ריקה</p>
              <p className="mt-2 text-slate-500">
                התחל ביצירת ישות ראשונה בלוח הניהול כדי להגדיר שדות ורשומות.
              </p>
            </div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 font-medium text-white shadow-sm hover:bg-primary-700"
            >
              <Settings className="h-5 w-5" />
              לוח ניהול
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
