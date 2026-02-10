"use client";

import { useEffect, useState } from "react";
import { BarChart3, TrendingUp } from "lucide-react";

type EntitySummary = { slug: string; name: string; total: number; last30: number };
type SeriesItem = { label: string; count: number };

export default function ReportsPage() {
  const [entities, setEntities] = useState<EntitySummary[]>([]);
  const [selectedEntity, setSelectedEntity] = useState("");
  const [report, setReport] = useState<{ entity?: { slug: string; name: string }; series?: SeriesItem[]; total?: number; lastPeriod?: number; fieldLabel?: string } | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => r.json())
      .then((data) => {
        setEntities(data.entities || []);
        if ((data.entities || []).length > 0 && !selectedEntity) setSelectedEntity(data.entities[0].slug);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedEntity) return;
    setLoading(true);
    fetch(`/api/reports?entity=${encodeURIComponent(selectedEntity)}&days=${days}`)
      .then((r) => r.json())
      .then(setReport)
      .finally(() => setLoading(false));
  }, [selectedEntity, days]);

  if (loading && !report && entities.length === 0) {
    return (
      <div className="p-8">
        <div className="animate-pulse h-64 rounded bg-slate-200 dark:bg-slate-700" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
        <BarChart3 className="h-8 w-8" />
        דוחות וניתוחים
      </h1>
      <p className="text-slate-600 dark:text-slate-400 mb-6">
        סטטיסטיקות לפי כרטיס, שלב ותאריך.
      </p>

      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <label className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">כרטיס:</span>
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-sm"
          >
            {entities.map((e) => (
              <option key={e.slug} value={e.slug}>{e.name}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">תקופה (ימים):</span>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-sm"
          >
            <option value={7}>7</option>
            <option value={30}>30</option>
            <option value={90}>90</option>
            <option value={365}>365</option>
          </select>
        </label>
      </div>

      {loading && report && (
        <div className="animate-pulse h-48 rounded bg-slate-100 dark:bg-slate-700 mb-6" />
      )}

      {report && !loading && (
        <div className="space-y-6">
          {report.series && report.series.length > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                {report.fieldLabel || "התפלגות"} – {report.entity?.name}
              </h2>
              <div className="space-y-2">
                {report.series.map((s) => {
                  const max = Math.max(...report.series!.map((x) => x.count), 1);
                  const pct = (s.count / max) * 100;
                  return (
                    <div key={s.label} className="flex items-center gap-3">
                      <span className="w-32 text-sm text-slate-600 dark:text-slate-400 truncate">{s.label}</span>
                      <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-700 rounded overflow-hidden">
                        <div
                          className="h-full bg-primary-500 dark:bg-primary-600 rounded"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-12 text-sm font-medium text-slate-700 dark:text-slate-200">{s.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {(report.total != null || report.lastPeriod != null) && !report.series?.length && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-6 shadow-sm flex gap-6">
              {report.total != null && (
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">סה״כ רשומות</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{report.total}</p>
                </div>
              )}
              {report.lastPeriod != null && (
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">נוספו בתקופה</p>
                  <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{report.lastPeriod}</p>
                </div>
              )}
            </div>
          )}
          {entities.length > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                סיכום כרטיסים
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {entities.map((e) => (
                  <div key={e.slug} className="rounded-lg border border-slate-200 dark:border-slate-600 p-4">
                    <p className="font-medium text-slate-800 dark:text-slate-100">{e.name}</p>
                    <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{e.total}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">+{e.last30} ב־30 יום</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
