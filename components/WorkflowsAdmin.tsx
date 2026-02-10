"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, ChevronLeft } from "lucide-react";
import Modal from "./Modal";

type Rule = {
  id: string;
  name: string;
  entitySlug: string;
  trigger: string;
  condition: string | null;
  action: string;
  actionConfig: string | null;
  isActive: boolean;
};

const TRIGGERS = [
  { value: "record.created", label: "נוצרה רשומה" },
  { value: "record.updated", label: "עודכנה רשומה" },
];
const ACTIONS = [
  { value: "create_task", label: "צור משימה" },
  { value: "call_webhook", label: "קריאה ל-URL (webhook)" },
];

export default function WorkflowsAdmin() {
  const [list, setList] = useState<Rule[]>([]);
  const [entities, setEntities] = useState<{ slug: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Rule | null>(null);
  const [form, setForm] = useState({
    name: "",
    entitySlug: "",
    trigger: "record.updated",
    conditionField: "",
    conditionOp: "equals",
    conditionValue: "",
    action: "create_task",
    taskTitle: "",
    webhookUrl: "",
    isActive: true,
  });

  const fetchList = () =>
    fetch("/api/admin/workflow-rules")
      .then((r) => r.json())
      .then(setList)
      .finally(() => setLoading(false));
  const fetchEntities = () =>
    fetch("/api/admin/entities")
      .then((r) => r.json())
      .then((arr: { slug: string; name: string }[]) => setEntities(Array.isArray(arr) ? arr.map((e) => ({ slug: e.slug, name: e.name })) : []));
  useEffect(() => {
    void fetchList();
    void fetchEntities();
  }, []);

  const openModal = (item?: Rule) => {
    if (item) {
      let cond: { field?: string; op?: string; value?: string } = {};
      if (item.condition) {
        try {
          cond = JSON.parse(item.condition);
        } catch {}
      }
      let config: { taskTitle?: string; webhookUrl?: string } = {};
      if (item.actionConfig) {
        try {
          config = JSON.parse(item.actionConfig);
        } catch {}
      }
      setEditing(item);
      setForm({
        name: item.name,
        entitySlug: item.entitySlug,
        trigger: item.trigger,
        conditionField: cond.field || "",
        conditionOp: cond.op || "equals",
        conditionValue: cond.value || "",
        action: item.action,
        taskTitle: config.taskTitle || "",
        webhookUrl: config.webhookUrl || "",
        isActive: item.isActive,
      });
    } else {
      setEditing(null);
      setForm({
        name: "",
        entitySlug: entities[0]?.slug || "",
        trigger: "record.updated",
        conditionField: "",
        conditionOp: "equals",
        conditionValue: "",
        action: "create_task",
        taskTitle: "",
        webhookUrl: "",
        isActive: true,
      });
    }
    setModalOpen(true);
  };

  const submit = async () => {
    if (!form.name.trim() || !form.entitySlug) return;
    if (form.action === "create_task" && !form.taskTitle.trim()) return;
    if (form.action === "call_webhook" && !form.webhookUrl.trim()) return;
    const condition =
      form.conditionField.trim()
        ? JSON.stringify({
            field: form.conditionField.trim(),
            op: form.conditionOp,
            value: form.conditionValue.trim(),
          })
        : null;
    const actionConfig =
      form.action === "create_task"
        ? JSON.stringify({ taskTitle: form.taskTitle.trim() })
        : JSON.stringify({ webhookUrl: form.webhookUrl.trim() });
    const body = {
      name: form.name.trim(),
      entitySlug: form.entitySlug,
      trigger: form.trigger,
      condition,
      action: form.action,
      actionConfig,
      isActive: form.isActive,
    };
    if (editing) {
      await fetch(`/api/admin/workflow-rules/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/admin/workflow-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }
    setModalOpen(false);
    fetchList();
  };

  const remove = async (id: string) => {
    if (!confirm("למחוק כלל אוטומציה?")) return;
    await fetch(`/api/admin/workflow-rules/${id}`, { method: "DELETE" });
    fetchList();
  };

  if (loading) return <div className="p-8 animate-pulse h-64 rounded bg-slate-200 dark:bg-slate-700" />;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-1 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
          <ChevronLeft className="h-4 w-4" /> חזרה
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">אוטומציות (Workflow)</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" /> הוסף כלל
        </button>
      </div>
      <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
        כשנוצרת או מתעדכנת רשומה – ניתן להפעיל פעולה אוטומטית (יצירת משימה או קריאה ל-URL). אופציונלי: תנאי לפי שדה (שווה / מכיל / לא ריק).
      </p>
      <div className="space-y-3">
        {list.map((item) => {
          let condStr = "תמיד";
          if (item.condition) {
            try {
              const c = JSON.parse(item.condition);
              condStr = `${c.field || "?"} ${c.op === "equals" ? "=" : c.op === "contains" ? "מכיל" : "לא ריק"} ${c.value || ""}`;
            } catch {}
          }
          let actionStr = item.action === "create_task" ? "צור משימה" : "Webhook";
          if (item.actionConfig) {
            try {
              const cfg = JSON.parse(item.actionConfig);
              if (item.action === "create_task" && cfg.taskTitle) actionStr = `משימה: ${cfg.taskTitle}`;
              if (item.action === "call_webhook" && cfg.webhookUrl) actionStr = `URL: ${cfg.webhookUrl}`;
            } catch {}
          }
          return (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-600 dark:bg-slate-800"
            >
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-100">{item.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {item.entitySlug} • {TRIGGERS.find((t) => t.value === item.trigger)?.label ?? item.trigger} • תנאי: {condStr} → {actionStr}
                </p>
              </div>
              <div className="flex gap-2">
                {!item.isActive && (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">מושבת</span>
                )}
                <button
                  onClick={() => openModal(item)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  עריכה
                </button>
                <button
                  onClick={() => remove(item.id)}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30"
                >
                  מחק
                </button>
              </div>
            </div>
          );
        })}
        {list.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-500 dark:border-slate-600 dark:text-slate-400">
            אין כללי אוטומציה. הוסף כלל כדי ליצור משימות או לקרוא ל-URL אוטומטית.
          </div>
        )}
      </div>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "עריכת כלל אוטומציה" : "כלל אוטומציה חדש"}>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">שם הכלל</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              placeholder="למשל: משימת מעקב כשלאד מוקצה"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">כרטיס</label>
            <select
              value={form.entitySlug}
              onChange={(e) => setForm((f) => ({ ...f, entitySlug: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              {entities.map((e) => (
                <option key={e.slug} value={e.slug}>
                  {e.name} ({e.slug})
                </option>
              ))}
              {entities.length === 0 && <option value="">— בחר כרטיס —</option>}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">טריגר</label>
            <select
              value={form.trigger}
              onChange={(e) => setForm((f) => ({ ...f, trigger: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              {TRIGGERS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-600 dark:bg-slate-800/50">
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">תנאי (ריק = תמיד)</label>
            <div className="grid grid-cols-[1fr,auto,1fr] gap-2">
              <input
                value={form.conditionField}
                onChange={(e) => setForm((f) => ({ ...f, conditionField: e.target.value }))}
                placeholder="שם שדה"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
              <select
                value={form.conditionOp}
                onChange={(e) => setForm((f) => ({ ...f, conditionOp: e.target.value }))}
                className="rounded-lg border border-slate-300 px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="equals">שווה</option>
                <option value="contains">מכיל</option>
                <option value="notEmpty">לא ריק</option>
              </select>
              <input
                value={form.conditionValue}
                onChange={(e) => setForm((f) => ({ ...f, conditionValue: e.target.value }))}
                placeholder="ערך (ללא notEmpty)"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">פעולה</label>
            <select
              value={form.action}
              onChange={(e) => setForm((f) => ({ ...f, action: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              {ACTIONS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
          {form.action === "create_task" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">כותרת המשימה</label>
              <input
                value={form.taskTitle}
                onChange={(e) => setForm((f) => ({ ...f, taskTitle: e.target.value }))}
                placeholder="למשל: ביצוע מעקב"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          )}
          {form.action === "call_webhook" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">כתובת URL</label>
              <input
                value={form.webhookUrl}
                onChange={(e) => setForm((f) => ({ ...f, webhookUrl: e.target.value }))}
                placeholder="https://..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          )}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-primary-600"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">הכלל פעיל</span>
          </label>
          <div className="flex justify-end gap-2 pt-4">
            <button onClick={() => setModalOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-400">
              ביטול
            </button>
            <button onClick={submit} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
              שמור
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
