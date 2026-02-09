"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Key, Trash2, ChevronLeft, Copy } from "lucide-react";
import Modal from "./Modal";

type ApiKeyItem = { id: string; name: string; keyPrefix: string; lastUsedAt: string | null; expiresAt: string | null; createdAt: string };

export default function ApiKeysAdmin() {
  const [list, setList] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", permissions: ["records:read", "records:write"] });

  const fetchList = () => fetch("/api/admin/api-keys").then((r) => r.json()).then(setList).finally(() => setLoading(false));
  useEffect(() => { void fetchList(); }, []);

  const create = async () => {
    if (!form.name.trim()) return;
    const res = await fetch("/api/admin/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name.trim(), permissions: form.permissions }),
    });
    const data = await res.json();
    setNewKey(data.key);
    fetchList();
  };

  const closeModal = () => {
    setModalOpen(false);
    setNewKey(null);
    setForm({ name: "", permissions: ["records:read", "records:write"] });
  };

  const remove = async (id: string) => {
    if (!confirm("למחוק מפתח API? לא ניתן לשחזר.")) return;
    await fetch(`/api/admin/api-keys/${id}`, { method: "DELETE" });
    fetchList();
  };

  const copyKey = () => {
    if (newKey) navigator.clipboard.writeText(newKey);
  };

  if (loading) return <div className="p-8 animate-pulse h-64 rounded bg-slate-200" />;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-1 text-slate-600 hover:text-slate-800">
          <ChevronLeft className="h-4 w-4" /> חזרה
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">מפתחות API</h1>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
          <Plus className="h-4 w-4" /> צור מפתח
        </button>
      </div>
      <p className="mb-6 text-slate-600">מפתחות לגישה חיצונית ל-API. השתמש ב־Authorization: Bearer &lt;key&gt;</p>

      <div className="space-y-3">
        {list.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-slate-800">{item.name}</p>
                <p className="text-sm text-slate-500">{item.keyPrefix}••••••••</p>
                <p className="text-xs text-slate-400">נוצר {new Date(item.createdAt).toLocaleDateString("he-IL")} | שימוש אחרון: {item.lastUsedAt ? new Date(item.lastUsedAt).toLocaleString("he-IL") : "—"}</p>
              </div>
            </div>
            <button onClick={() => remove(item.id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">מחק</button>
          </div>
        ))}
        {list.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-500">אין מפתחות API. לחץ "צור מפתח" להתחיל.</div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={closeModal} title="מפתח API חדש">
        {newKey ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-amber-800">
              <p className="font-medium mb-2">שמור את המפתח! הוא לא יוצג שוב.</p>
              <code className="block bg-white p-2 rounded text-sm break-all">{newKey}</code>
              <button onClick={copyKey} className="mt-2 flex items-center gap-1 text-sm text-amber-700 hover:underline">
                <Copy className="h-4 w-4" /> העתק
              </button>
            </div>
            <button onClick={closeModal} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white">הבנתי</button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">שם</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="למשל: Zapier" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">הרשאות</label>
              <input value={form.permissions.join(", ")} onChange={(e) => setForm((f) => ({ ...f, permissions: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))} placeholder="records:read, records:write" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button onClick={closeModal} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600">ביטול</button>
              <button onClick={create} disabled={!form.name.trim()} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">צור</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
