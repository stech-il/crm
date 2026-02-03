"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Filter } from "lucide-react";
import SavedViewsSidebar from "./SavedViewsSidebar";

type Customer = {
  id: string;
  name: string;
  primaryPhone: string | null;
  settlement: string | null;
  manager: { name: string } | null;
  createdAt: string;
  updatedAt: string;
};

export default function CustomersList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "card">("list");

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    fetch(`/api/customers?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setCustomers(data);
        setLoading(false);
      });
  }, [search]);

  return (
    <div className="flex">
    <div className="flex-1 p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">
          חיפוש לקוחות ({customers.length.toLocaleString("he-IL")})
        </h1>
        <Link
          href="/customers/new"
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          חדש
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("list")}
            className={`rounded px-3 py-1.5 text-sm ${viewMode === "list" ? "bg-primary-100 text-primary-700" : "bg-slate-100 text-slate-600"}`}
          >
            רשימה
          </button>
          <button
            onClick={() => setViewMode("card")}
            className={`rounded px-3 py-1.5 text-sm ${viewMode === "card" ? "bg-primary-100 text-primary-700" : "bg-slate-100 text-slate-600"}`}
          >
            כרטיסיה
          </button>
        </div>
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="חיפוש..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-2 pr-10 pl-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <button className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50">
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-slate-200" />
          ))}
        </div>
      ) : viewMode === "list" ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">שם לקוח</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">נוצר בתאריך</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">מנהל לקוח</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">עודכן בתאריך</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">ישוב</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <input type="checkbox" className="rounded" />
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/customers/${c.id}`} className="font-medium text-primary-600 hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(c.createdAt).toLocaleString("he-IL")}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{c.manager?.name ?? "—"}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(c.updatedAt).toLocaleString("he-IL")}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{c.settlement ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {customers.length === 0 && (
            <div className="py-16 text-center text-slate-500">אין לקוחות. הוסף את הראשון!</div>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {customers.map((c) => (
            <Link
              key={c.id}
              href={`/customers/${c.id}`}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <p className="font-semibold text-slate-800">{c.name}</p>
              <p className="mt-1 text-sm text-slate-600">{c.primaryPhone ?? "—"}</p>
              <p className="text-sm text-slate-500">{c.settlement ?? "—"}</p>
              <p className="mt-2 text-xs text-slate-400">{c.manager?.name ?? "—"}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
    <SavedViewsSidebar module="customers" />
    </div>
  );
}
