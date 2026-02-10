"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, ChevronLeft } from "lucide-react";
import Modal from "./Modal";

type Campaign = {
  id: string;
  name: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: string;
  _count?: { records: number };
};

export default function CampaignsAdmin() {
  const [list, setList] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [form, setForm] = useState({ name: "", description: "", startDate: "", endDate: "", status: "active" });

  const fetchList = () =>
    fetch("/api/admin/campaigns")
      .then((r) => r.json())
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));

  useEffect(() => {
    fetchList();
  }, []);

  const openModal = (item?: Campaign) => {
    if (item) {
      setEditing(item);
      setForm({
        name: item.name,
        description: item.description || "",
        startDate: item.startDate ? item.startDate.slice(0, 10) : "",
        endDate: item.endDate ? item.endDate.slice(0, 10) : "",
        status: item.status || "active",
      });
    } else {
      setEditing(null);
      setForm({ name: "", description: "", startDate: "", endDate: "", status: "active" });
    }
    setModalOpen(true);
  };

  const submit = async () => {
    if (!form.name.trim()) return;
    if (editing) {
      await fetch(`/api/admin/campaigns/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          status: form.status,
        }),
      });
    } else {
      await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          status: form.status,
        }),
      });
    }
    setModalOpen(false);
    fetchList();
  };

  const remove = async (id: string) => {
    if (!confirm("למחוק קמפיין?")) return;
    await fetch(`/api/admin/campaigns/${id}`, { method: "DELETE" });
    fetchList();
  };

  if (loading) return <div className="p-8 animate-pulse h-64 rounded bg-slate-200 dark:bg-slate-700" />;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
          <ChevronLeft className="h-4 w-4" /> חזרה
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">קמפיינים שיווקיים</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" /> הוסף קמפיין
        </button>
      </div>
      <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
        צור קמפיינים ושייך רשומות אליהם מדף הרשומה (קמפיינים).
      </p>
      <div className="space-y-3">
        {list.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-4"
          >
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-100">{item.name}</p>
              {item.description && <p className="text-sm text-slate-500 dark:text-slate-400">{item.description}</p>}
              <p className="text-xs text-slate-400 mt-1">
                {item._count?.records ?? 0} רשומות
                {item.startDate && ` • מ־${new Date(item.startDate).toLocaleDateString("he-IL")}`}
                {item.endDate && ` עד ${new Date(item.endDate).toLocaleDateString("he-IL")}`}
              </p>
            </div>
            <div className="flex gap-2">
              <span className={`rounded px-2 py-0.5 text-xs ${item.status === "active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"}`}>
                {item.status === "active" ? "פעיל" : item.status}
              </span>
              <button onClick={() => openModal(item)} className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                עריכה
              </button>
              <button onClick={() => remove(item.id)} className="rounded-lg border border-red-200 dark:border-red-800 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30">
                מחק
              </button>
            </div>
          </div>
        ))}
        {list.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-12 text-center text-slate-500 dark:text-slate-400">
            אין קמפיינים. הוסף קמפיין להתחלה.
          </div>
        )}
      </div>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "עריכת קמפיין" : "קמפיין חדש"}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">שם</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">תיאור (אופציונלי)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">תאריך התחלה</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">תאריך סיום</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">סטטוס</label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-3 py-2"
            >
              <option value="draft">טיוטה</option>
              <option value="active">פעיל</option>
              <option value="completed">הושלם</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button onClick={() => setModalOpen(false)} className="rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm text-slate-600 dark:text-slate-300">
              ביטול
            </button>
            <button onClick={submit} disabled={!form.name.trim()} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
              שמור
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
