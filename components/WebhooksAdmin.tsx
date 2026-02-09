"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, ChevronLeft } from "lucide-react";
import Modal from "./Modal";

type WebhookItem = { id: string; name: string; url: string; isActive: boolean; events: string; entitySlug: string | null };

const EVENTS = ["record.created", "record.updated", "record.deleted", "record.archived"];

export default function WebhooksAdmin() {
  const [list, setList] = useState<WebhookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<WebhookItem | null>(null);
  const [form, setForm] = useState({ name: "", url: "", secret: "", events: EVENTS as string[], entitySlug: "" });

  const fetchList = () => fetch("/api/admin/webhooks").then((r) => r.json()).then(setList).finally(() => setLoading(false));
  useEffect(() => { fetchList(); }, []);

  const openModal = (item?: WebhookItem) => {
    if (item) {
      let events: string[] = [];
      try {
        events = JSON.parse(item.events);
      } catch {}
      setEditing(item);
      setForm({ name: item.name, url: item.url, secret: "", events, entitySlug: item.entitySlug || "" });
    } else {
      setEditing(null);
      setForm({ name: "", url: "", secret: "", events: [...EVENTS], entitySlug: "" });
    }
    setModalOpen(true);
  };

  const submit = async () => {
    if (!form.name.trim() || !form.url.trim()) return;
    const body: Record<string, unknown> = { name: form.name.trim(), url: form.url.trim(), events: form.events, entitySlug: form.entitySlug.trim() || null };
    if (form.secret) body.secret = form.secret;
    if (editing) {
      await fetch(`/api/admin/webhooks/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    } else {
      await fetch("/api/admin/webhooks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    }
    setModalOpen(false);
    fetchList();
  };

  const remove = async (id: string) => {
    if (!confirm("למחוק webhook?")) return;
    await fetch(`/api/admin/webhooks/${id}`, { method: "DELETE" });
    fetchList();
  };

  if (loading) return <div className="p-8 animate-pulse h-64 rounded bg-slate-200" />;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-1 text-slate-600 hover:text-slate-800"><ChevronLeft className="h-4 w-4" /> חזרה</Link>
        <h1 className="text-2xl font-bold text-slate-800">Webhooks</h1>
        <button onClick={() => openModal()} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"><Plus className="h-4 w-4" /> הוסף</button>
      </div>
      <div className="space-y-3">
        {list.map((item) => {
          let events: string[] = [];
          try { events = JSON.parse(item.events); } catch {}
          return (
            <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
              <div>
                <p className="font-medium text-slate-800">{item.name}</p>
                <p className="text-sm text-slate-500 break-all">{item.url}</p>
                <p className="text-xs text-slate-400 mt-1">אירועים: {events.join(", ")}</p>
              </div>
              <div className="flex gap-2">
                {!item.isActive && <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">מושבת</span>}
                <button onClick={() => openModal(item)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">עריכה</button>
                <button onClick={() => remove(item.id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">מחק</button>
              </div>
            </div>
          );
        })}
        {list.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-500">אין webhooks</div>}
      </div>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "עריכת Webhook" : "Webhook חדש"}>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">שם</label><input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">URL</label><input value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://..." className="w-full rounded-lg border border-slate-300 px-3 py-2" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Secret (אופציונלי)</label><input type="password" value={form.secret} onChange={(e) => setForm((f) => ({ ...f, secret: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">ישות (ריק = כולן)</label><input value={form.entitySlug} onChange={(e) => setForm((f) => ({ ...f, entitySlug: e.target.value }))} placeholder="leads" className="w-full rounded-lg border border-slate-300 px-3 py-2" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-2">אירועים</label>
            <div className="flex flex-wrap gap-2">{EVENTS.map((ev) => (
              <label key={ev} className="flex items-center gap-2">
                <input type="checkbox" checked={form.events.includes(ev)} onChange={(e) => setForm((f) => ({ ...f, events: e.target.checked ? [...f.events, ev] : f.events.filter((x) => x !== ev) }))} />
                <span className="text-sm">{ev}</span>
              </label>
            ))}</div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button onClick={() => setModalOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600">ביטול</button>
            <button onClick={submit} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">שמור</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
