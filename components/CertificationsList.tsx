"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";

type Certification = {
  id: string;
  company: string;
  name: string;
  field: string | null;
  certifiedOn: string | null;
  status: string | null;
  endDate: string | null;
  contactPerson: string | null;
  user: { name: string } | null;
};

export default function CertificationsList() {
  const [certs, setCerts] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    fetch(`/api/certifications?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setCerts(data);
        setLoading(false);
      });
  }, [statusFilter]);

  const inEffect = certs.filter((c) => c.status === "בתוקף" || !c.status).length;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">
          אישורים בתוקף ({inEffect})
        </h1>
        <Link
          href="/certifications/new"
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          חדש
        </Link>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setStatusFilter("")}
          className={`rounded px-3 py-1.5 text-sm ${!statusFilter ? "bg-primary-100 text-primary-700" : "bg-slate-100"}`}
        >
          הכל
        </button>
        <button
          onClick={() => setStatusFilter("בתוקף")}
          className={`rounded px-3 py-1.5 text-sm ${statusFilter === "בתוקף" ? "bg-primary-100 text-primary-700" : "bg-slate-100"}`}
        >
          בתוקף
        </button>
        <button
          onClick={() => setStatusFilter("לא בתוקף")}
          className={`rounded px-3 py-1.5 text-sm ${statusFilter === "לא בתוקף" ? "bg-primary-100 text-primary-700" : "bg-slate-100"}`}
        >
          לא בתוקף
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-slate-200" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">חברה</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">שם</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">תחום</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">אישור על</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">סטטוס</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">תאריך סיום</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">משתמש</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {certs.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <Link href={`/certifications/${c.id}`} className="font-medium text-primary-600 hover:underline">
                      {c.company}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm">{c.name}</td>
                  <td className="px-6 py-4 text-sm">{c.field ?? "—"}</td>
                  <td className="px-6 py-4 text-sm">{c.certifiedOn ?? "—"}</td>
                  <td className="px-6 py-4 text-sm">{c.status ?? "—"}</td>
                  <td className="px-6 py-4 text-sm">
                    {c.endDate ? new Date(c.endDate).toLocaleDateString("he-IL") : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm">{c.user?.name ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {certs.length === 0 && (
            <div className="py-16 text-center text-slate-500">אין אישורים</div>
          )}
        </div>
      )}
    </div>
  );
}
