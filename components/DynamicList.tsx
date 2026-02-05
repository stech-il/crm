"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { formatFieldValue, isFileValue } from "../lib/formatFieldValue";
import { usePolling } from "../lib/usePolling";

type FieldDef = { id: string; name: string; label: string; type: string };
type Entity = { id: string; name: string; slug: string; fields: FieldDef[] };
type DynamicRecordItem = { id: string; data: Record<string, unknown>; updatedAt: string };

type Props = {
  entitySlug: string;
};

export default function DynamicList({ entitySlug }: Props) {
  const [entity, setEntity] = useState<Entity | null>(null);
  const [records, setRecords] = useState<DynamicRecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = () => {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    fetch(`/api/dynamic/${entitySlug}${params}`)
      .then((r) => r.json())
      .then((res) => {
        setEntity(res.entity);
        setRecords(res.records || []);
        setLoading(false);
      });
  };

  useEffect(() => fetchData(), [entitySlug, search]);
  usePolling(fetchData, [entitySlug, search]);

  if (!entity) {
    if (loading) return <div className="p-8 animate-pulse h-64 bg-slate-200 rounded" />;
    return (
      <div className="p-8">
        <p className="text-slate-500">ישות לא נמצאה.</p>
        <Link href="/admin" className="mt-4 inline-block text-primary-600 hover:underline">
          ← חזרה לניהול
        </Link>
      </div>
    );
  }

  if (!entity.fields || entity.fields.length === 0) {
    return (
      <div className="p-8">
        <h1 className="mb-4 text-2xl font-bold text-slate-800">{entity.name}</h1>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <p className="text-amber-800">
            אין שדות מוגדרים לישות זו. הוסף שדות בלוח הניהול כדי ליצור רשומות.
          </p>
          <Link
            href="/admin"
            className="mt-4 inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            עבור לניהול
          </Link>
        </div>
      </div>
    );
  }

  const displayFields = (entity.fields || []).slice(0, 5);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">
          {entity.name} ({records.length})
        </h1>
        <Link
          href={`/dynamic/${entitySlug}/new`}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          חדש
        </Link>
      </div>

      <div className="mb-4 flex gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="חיפוש..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 py-2 pr-10 pl-3 text-sm"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              {displayFields.map((f) => (
                <th key={f.id} className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                  {f.label}
                </th>
              ))}
              <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">עודכן</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {records.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                {displayFields.map((f) => (
                  <td key={f.id} className="px-6 py-4">
                    <Link
                      href={`/dynamic/${entitySlug}/${r.id}`}
                      className="font-medium text-primary-600 hover:underline"
                    >
                      {(() => {
                        const val = (r.data as Record<string, unknown>)[f.name];
                        if (isFileValue(val)) return val.filename || "קובץ";
                        return formatFieldValue(val);
                      })()}
                    </Link>
                  </td>
                ))}
                <td className="px-6 py-4 text-sm text-slate-600">
                  {new Date(r.updatedAt).toLocaleString("he-IL")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {records.length === 0 && (
          <div className="py-16 text-center text-slate-500">אין רשומות</div>
        )}
      </div>
    </div>
  );
}
