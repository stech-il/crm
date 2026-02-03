"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, User } from "lucide-react";

type Contact = { id: string; name: string };
type Deal = {
  id: string;
  title: string;
  value: number;
  stage: string;
  description: string | null;
  contact: Contact | null;
};

const STAGES = [
  { id: "lead", label: "ליד" },
  { id: "qualified", label: "איכותי" },
  { id: "proposal", label: "הצעה" },
  { id: "negotiation", label: "משא ומתן" },
  { id: "closed_won", label: "נסגר בהצלחה" },
  { id: "closed_lost", label: "נסגר בהפסד" },
];

export default function DealsList() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Deal | null>(null);
  const [form, setForm] = useState({ title: "", value: 0, stage: "lead", contactId: "", description: "" });

  const fetchDeals = () => {
    fetch("/api/deals")
      .then((r) => r.json())
      .then((data) => {
        setDeals(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDeals();
    fetch("/api/contacts").then((r) => r.json()).then(setContacts);
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", value: 0, stage: "lead", contactId: "", description: "" });
    setShowModal(true);
  };

  const openEdit = (d: Deal) => {
    setEditing(d);
    setForm({
      title: d.title,
      value: d.value,
      stage: d.stage,
      contactId: d.contact?.id ?? "",
      description: d.description ?? "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: form.title,
      value: Number(form.value),
      stage: form.stage,
      contactId: form.contactId || null,
      description: form.description || null,
    };
    if (editing) {
      await fetch(`/api/deals/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setShowModal(false);
    fetchDeals();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("למחוק את העסקה?")) return;
    await fetch(`/api/deals/${id}`, { method: "DELETE" });
    fetchDeals();
  };

  const updateStage = async (deal: Deal, newStage: string) => {
    await fetch(`/api/deals/${deal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: newStage }),
    });
    fetchDeals();
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">עסקאות</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          הוסף עסקה
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-slate-200" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {STAGES.map((stage) => {
            const stageDeals = deals.filter((d) => d.stage === stage.id);
            return (
              <div key={stage.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="mb-4 font-semibold text-slate-700">{stage.label}</h2>
                <div className="space-y-2">
                  {stageDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-4 hover:bg-slate-100"
                    >
                      <div>
                        <p className="font-medium text-slate-800">{deal.title}</p>
                        <p className="text-sm text-slate-600">₪{deal.value.toLocaleString("he-IL")}</p>
                        {deal.contact && (
                          <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                            <User className="h-4 w-4" />
                            {deal.contact.name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={deal.stage}
                          onChange={(e) => updateStage(deal, e.target.value)}
                          className="rounded border border-slate-300 px-2 py-1 text-sm"
                        >
                          {STAGES.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                        <button onClick={() => openEdit(deal)} className="rounded p-1.5 text-slate-500 hover:bg-slate-200">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(deal.id)} className="rounded p-1.5 text-red-500 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {stageDeals.length === 0 && (
                  <p className="py-4 text-center text-sm text-slate-400">אין עסקאות</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">{editing ? "עריכת עסקה" : "עסקה חדשה"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600">כותרת *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600">ערך (₪)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.value || ""}
                  onChange={(e) => setForm({ ...form, value: Number(e.target.value) || 0 })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600">שלב</label>
                <select
                  value={form.stage}
                  onChange={(e) => setForm({ ...form, stage: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  {STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600">איש קשר</label>
                <select
                  value={form.contactId}
                  onChange={(e) => setForm({ ...form, contactId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="">ללא</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600">תיאור</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button type="submit" className="flex-1 rounded-lg bg-primary-600 py-2 font-medium text-white hover:bg-primary-700">
                  {editing ? "שמור" : "הוסף"}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-600 hover:bg-slate-50">
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
