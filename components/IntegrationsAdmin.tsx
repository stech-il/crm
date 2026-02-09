"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Zap, Mail, Phone, Webhook, Pencil, Trash2, ChevronLeft } from "lucide-react";
import Modal from "./Modal";

type Integration = { id: string; type: string; name: string; isActive: boolean; config: object; createdAt: string; _count?: { logs: number } };

const TYPE_LABELS: Record<string, string> = {
  twilio: "Twilio (SMS)",
  sendgrid: "SendGrid (אימייל)",
  webhook: "Webhook",
  slack: "Slack",
  zapier: "Zapier",
};

const TYPE_CREDS: Record<string, { label: string; name: string }[]> = {
  twilio: [
    { label: "Account SID", name: "accountSid" },
    { label: "Auth Token", name: "authToken" },
    { label: "מספר שולח", name: "from" },
  ],
  sendgrid: [
    { label: "API Key", name: "apiKey" },
    { label: "כתובת שולח", name: "from" },
  ],
  webhook: [{ label: "URL (אופציונלי)", name: "url" }],
};

export default function IntegrationsAdmin() {
  const [list, setList] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Integration | null>(null);
  const [form, setForm] = useState({ type: "twilio", name: "", credentials: {} as Record<string, string>, config: {} as Record<string, string> });

  const fetchList = () => fetch("/api/admin/integrations").then((r) => r.json()).then(setList).finally(() => setLoading(false));
  useEffect(() => fetchList(), []);

  const openModal = (item?: Integration) => {
    if (item) {
      setEditing(item);
      setForm({ type: item.type, name: item.name, credentials: {}, config: (item.config as Record<string, string>) || {} });
    } else {
      setEditing(null);
      setForm({ type: "twilio", name: "", credentials: {}, config: {} });
    }
    setModalOpen(true);
  };

  const submit = async () => {
    if (!form.name.trim()) return;
    const creds: Record<string, string> = {};
    const config: Record<string, string> = { ...form.config };
    for (const c of TYPE_CREDS[form.type] || []) {
      const val = form.credentials[c.name] || form.config[c.name];
      if (val) {
        if (c.name === "from") config.from = val;
        else creds[c.name] = val;
      }
    }
    if (editing) {
      await fetch(`/api/admin/integrations/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, config: Object.keys(config).length ? config : {}, credentials: Object.keys(creds).length ? creds : undefined }),
      });
    } else {
      await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: form.type, name: form.name, credentials: creds, config }),
      });
    }
    setModalOpen(false);
    fetchList();
  };

  const remove = async (id: string) => {
    if (!confirm("למחוק אינטגרציה?")) return;
    await fetch(`/api/admin/integrations/${id}`, { method: "DELETE" });
    fetchList();
  };

  const icon = (t: string) => {
    if (t === "twilio") return <Phone className="h-5 w-5" />;
    if (t === "sendgrid") return <Mail className="h-5 w-5" />;
    if (t === "webhook") return <Webhook className="h-5 w-5" />;
    return <Zap className="h-5 w-5" />;
  };

  if (loading) return <div className="p-8 animate-pulse h-64 rounded bg-slate-200" />;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-1 text-slate-600 hover:text-slate-800">
          <ChevronLeft className="h-4 w-4" /> חזרה
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">אינטגרציות</h1>
        <button onClick={() => openModal()} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
          <Plus className="h-4 w-4" /> הוסף
        </button>
      </div>
      <p className="mb-6 text-slate-600">חיבור למערכות חיצוניות: Twilio (SMS), SendGrid (אימייל), Webhooks.</p>
      <div className="space-y-3">
        {list.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-slate-100 p-2 text-slate-600">{icon(item.type)}</div>
              <div>
                <p className="font-medium text-slate-800">{item.name}</p>
                <p className="text-sm text-slate-500">{TYPE_LABELS[item.type] || item.type}</p>
              </div>
              {!item.isActive && <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">מושבת</span>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => openModal(item)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
                <Pencil className="h-4 w-4 inline ml-1" /> עריכה
              </button>
              <button onClick={() => remove(item.id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
                <Trash2 className="h-4 w-4 inline ml-1" /> מחק
              </button>
            </div>
          </div>
        ))}
        {list.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
            אין אינטגרציות. לחץ "הוסף" כדי לחבר Twilio, SendGrid או שירות אחר.
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "עריכת אינטגרציה" : "אינטגרציה חדשה"}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">סוג</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              disabled={!!editing}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">שם</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="למשל: Twilio ראשי"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          {(TYPE_CREDS[form.type] || []).map((c) => (
            <div key={c.name}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{c.label}</label>
              <input
                type={c.name.includes("Token") || c.name.includes("Key") ? "password" : "text"}
                value={form.credentials[c.name] || form.config[c.name] || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (c.name === "from") setForm((f) => ({ ...f, config: { ...f.config, from: val } }));
                  else setForm((f) => ({ ...f, credentials: { ...f.credentials, [c.name]: val } }));
                }}
                placeholder={editing ? "השאר ריק לבל לשנות" : ""}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-4">
            <button onClick={() => setModalOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600">ביטול</button>
            <button onClick={submit} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">שמור</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
