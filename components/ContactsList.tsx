"use client";

import { useEffect, useState } from "react";
import { Plus, Mail, Phone, Building, Pencil, Trash2 } from "lucide-react";

type Contact = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  position: string | null;
  notes: string | null;
  _count?: { deals: number };
};

export default function ContactsList() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", position: "", notes: "" });

  const fetchContacts = () => {
    fetch("/api/contacts")
      .then((r) => r.json())
      .then((data) => {
        setContacts(data);
        setLoading(false);
      });
  };

  useEffect(() => fetchContacts(), []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", email: "", phone: "", company: "", position: "", notes: "" });
    setShowModal(true);
  };

  const openEdit = (c: Contact) => {
    setEditing(c);
    setForm({
      name: c.name,
      email: c.email ?? "",
      phone: c.phone ?? "",
      company: c.company ?? "",
      position: c.position ?? "",
      notes: c.notes ?? "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, email: form.email || null, phone: form.phone || null, company: form.company || null, position: form.position || null, notes: form.notes || null };
    if (editing) {
      await fetch(`/api/contacts/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setShowModal(false);
    fetchContacts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("למחוק את האיש קשר?")) return;
    await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    fetchContacts();
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">אנשי קשר</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          הוסף איש קשר
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-slate-200" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">שם</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">אימייל</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">טלפון</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">חברה</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">עסקאות</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {contacts.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-800">{c.name}</span>
                    {c.position && <span className="block text-sm text-slate-500">{c.position}</span>}
                  </td>
                  <td className="px-6 py-4">
                    {c.email ? (
                      <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-primary-600 hover:underline">
                        <Mail className="h-4 w-4" />
                        {c.email}
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {c.phone ? (
                      <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-slate-600">
                        <Phone className="h-4 w-4" />
                        {c.phone}
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {c.company ? (
                      <span className="flex items-center gap-1">
                        <Building className="h-4 w-4" />
                        {c.company}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{c._count?.deals ?? 0}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(c)} className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="rounded p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {contacts.length === 0 && (
            <div className="py-16 text-center text-slate-500">אין אנשי קשר. הוסף את הראשון!</div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">{editing ? "עריכת איש קשר" : "איש קשר חדש"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600">שם *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600">אימייל</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600">טלפון</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600">חברה</label>
                <input
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600">תפקיד</label>
                <input
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600">הערות</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
