"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { LayoutDashboard, Settings, Plus, ArrowLeft, Users, FileText } from "lucide-react";
import { getEntityIcon } from "../lib/entityIcons";
import { usePolling } from "../lib/usePolling";

type EntitySummary = {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  recordsCount: number;
};

type DashboardData = {
  entitiesCount: number;
  recordsCount: number;
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
