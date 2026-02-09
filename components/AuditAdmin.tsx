"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

type Log = { id: string; userId: string | null; userEmail: string | null; action: string; entitySlug: string | null; recordId: string | null; createdAt: string };

export default function AuditAdmin() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");

  const fetchLogs = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (actionFilter) params.set("action", actionFilter);
    fetch(`/api/admin/audit?${params}`).then((r) => r.json()).then((res) => {
      setLogs(res.logs || []);
      setTotal(res.total ?? 0);
    }).finally(() => setLoading(false));
  };

  useEffect(() => fetchLogs(), [page, actionFilter]);
  const totalPages = Math.ceil(total / 50);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-1 text-slate-600 hover:text-slate-800"><ChevronLeft className="h-4 w-4" /> חזרה</Link>
        <h1 className="text-2xl font-bold text-slate-800">לוג פעולות (Audit)</h1>
      </div>
      <div className="mb-4"><select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="">כל הפעולות</option><option value="record.create">יצירת רשומה</option><option value="record.update">עדכון רשומה</option><option value="record.delete">מחיקת רשומה</option><option value="record.archive">ארכוב</option></select></div>
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50"><tr><th className="px-4 py-3 text-right text-sm font-semibold text-slate-600">תאריך</th><th className="px-4 py-3 text-right text-sm font-semibold text-slate-600">פעולה</th><th className="px-4 py-3 text-right text-sm font-semibold text-slate-600">משתמש</th><th className="px-4 py-3 text-right text-sm font-semibold text-slate-600">ישות</th></tr></thead>
          <tbody className="divide-y divide-slate-200">{logs.map((l) => (<tr key={l.id} className="hover:bg-slate-50"><td className="px-4 py-3 text-sm text-slate-600">{new Date(l.createdAt).toLocaleString("he-IL")}</td><td className="px-4 py-3 text-sm font-medium text-slate-800">{l.action}</td><td className="px-4 py-3 text-sm text-slate-600">{l.userEmail || l.userId || "-"}</td><td className="px-4 py-3 text-sm text-slate-600">{l.entitySlug || "-"} {l.recordId ? "#" + l.recordId.slice(0, 8) : ""}</td></tr>))}</tbody>
        </table>
        {loading && <div className="p-4 text-center text-slate-500">טוען...</div>}
      </div>
      {totalPages > 1 && <div className="mt-4 flex justify-center gap-2"><button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded border px-3 py-1 text-sm disabled:opacity-50">Back</button><span className="py-1 text-sm">עמוד {page} מתוך {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded border px-3 py-1 text-sm disabled:opacity-50">Next</button></div>}
    </div>
  );
}
