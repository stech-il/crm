"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Pencil, FileDown, Plus, Check, Trash2, Phone } from "lucide-react";
import { formatFieldValue, formatFieldValueForTitle, isFileValue } from "../lib/formatFieldValue";
import { usePolling } from "../lib/usePolling";

type FieldDef = { id: string; name: string; label: string; type: string; showInCard?: boolean };
type Entity = { id: string; name: string; slug: string; fields: FieldDef[] };
type Task = { id: string; title: string; done: boolean; order: number };
type CallLog = { id: string; phoneNumber: string; direction: string; duration?: number; notes?: string; createdAt: string; createdBy?: { name: string } };
type DynamicRecordData = {
  id: string;
  data: Record<string, unknown>;
  updatedAt: string;
  createdBy?: { id: string; name: string } | null;
  tasks?: Task[];
  callLogs?: CallLog[];
};

export default function DynamicDetailPage({
  entitySlug,
  recordId,
}: {
  entitySlug: string;
  recordId: string;
}) {
  const [entity, setEntity] = useState<Entity | null>(null);
  const [record, setRecord] = useState<DynamicRecordData | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newCallPhone, setNewCallPhone] = useState("");
  const [newCallNotes, setNewCallNotes] = useState("");

  const fetchData = useCallback(() => {
    fetch(`/api/dynamic/${entitySlug}/${recordId}`)
      .then((r) => r.json())
      .then((res) => {
        setEntity(res.entity);
        setRecord(res.record);
      });
  }, [entitySlug, recordId]);

  useEffect(() => fetchData(), [entitySlug, recordId]);
  usePolling(fetchData, [entitySlug, recordId]);

  useEffect(() => {
    if (entity && record) {
      const data = record.data as Record<string, unknown>;
      const title = formatFieldValueForTitle(data[entity.fields[0]?.name]) || record.id.slice(0, 8) || "רשומה";
      document.title = `${title} - ${entity.name} | CRM`;
    }
    return () => { document.title = "CRM"; };
  }, [entity, record]);

  const addTask = async () => {
    if (!newTaskTitle.trim()) return;
    await fetch(`/api/dynamic/${entitySlug}/${recordId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTaskTitle.trim() }),
    });
    setNewTaskTitle("");
    fetchData();
  };

  const toggleTask = async (taskId: string, done: boolean) => {
    await fetch(`/api/dynamic/${entitySlug}/${recordId}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done }),
    });
    fetchData();
  };

  const deleteTask = async (taskId: string) => {
    await fetch(`/api/dynamic/${entitySlug}/${recordId}/tasks/${taskId}`, { method: "DELETE" });
    fetchData();
  };

  const addCall = async () => {
    if (!newCallPhone.trim()) return;
    await fetch(`/api/dynamic/${entitySlug}/${recordId}/calls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: newCallPhone.trim(), direction: "outgoing", notes: newCallNotes.trim() || null }),
    });
    setNewCallPhone("");
    setNewCallNotes("");
    fetchData();
  };

  if (!entity || !record) {
    return (
      <div className="p-8">
        <div className="animate-pulse h-64 rounded bg-slate-200" />
      </div>
    );
  }

  const data = record.data as Record<string, unknown>;
  const tasks = record.tasks || [];
  const callLogs = record.callLogs || [];

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href={`/dynamic/${entitySlug}`} className="text-sm text-primary-600 hover:underline">
            ← חזרה ל{entity.name}
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-800">
            {formatFieldValueForTitle(data[entity.fields[0]?.name]) || record.id.slice(0, 8) || "רשומה"}
          </h1>
          {record.createdBy && (
            <p className="mt-1 text-sm text-slate-500">נוצר ע״י {record.createdBy.name}</p>
          )}
        </div>
        <Link
          href={`/dynamic/${entitySlug}/${recordId}/edit`}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Pencil className="h-4 w-4" />
          עריכה
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          {entity.fields.filter((f) => f.showInCard !== false).map((f) => (
            <div key={f.id}>
              <dt className="text-sm font-medium text-slate-500">{f.label}</dt>
              <dd className="mt-1 text-slate-800">
                {f.type === "checkbox"
                  ? data[f.name]
                    ? "כן"
                    : "לא"
                  : isFileValue(data[f.name])
                    ? (
                        <a
                          href={(data[f.name] as { url: string }).url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-primary-600 hover:underline"
                        >
                          <FileDown className="h-4 w-4" />
                          {(data[f.name] as { filename?: string }).filename || "הורד קובץ"}
                        </a>
                      )
                    : formatFieldValue(data[f.name], f.type)}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* משימות */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">משימות</h2>
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="הוסף משימה..."
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            onClick={addTask}
            className="flex items-center gap-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            הוסף
          </button>
        </div>
        <ul className="space-y-2">
          {tasks.map((t) => (
            <li key={t.id} className="flex items-center gap-2 rounded-lg bg-slate-50 p-2">
              <button
                onClick={() => toggleTask(t.id, !t.done)}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border ${t.done ? "bg-primary-500 border-primary-500 text-white" : "border-slate-300"}`}
              >
                {t.done && <Check className="h-4 w-4" />}
              </button>
              <span className={`flex-1 ${t.done ? "text-slate-500 line-through" : ""}`}>{t.title}</span>
              <button onClick={() => deleteTask(t.id)} className="p-1 text-slate-400 hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
          {tasks.length === 0 && <p className="text-sm text-slate-500">אין משימות</p>}
        </ul>
      </div>

      {/* לוג שיחות */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">לוג שיחות</h2>
        <div className="mb-4 flex flex-wrap gap-2">
          <input
            type="tel"
            value={newCallPhone}
            onChange={(e) => setNewCallPhone(e.target.value)}
            placeholder="מספר טלפון"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm w-40"
          />
          <input
            type="text"
            value={newCallNotes}
            onChange={(e) => setNewCallNotes(e.target.value)}
            placeholder="הערות"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm flex-1 min-w-[120px]"
          />
          <button
            onClick={addCall}
            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Phone className="h-4 w-4" />
            הוסף שיחה
          </button>
        </div>
        <ul className="space-y-2">
          {callLogs.map((c) => (
            <li key={c.id} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 text-sm">
              <Phone className="h-4 w-4 text-slate-400" />
              <div className="flex-1">
                <span className="font-medium">{c.phoneNumber}</span>
                <span className="mr-2 text-slate-500">({c.direction === "incoming" ? "נכנסת" : "יוצאת"})</span>
                {c.duration != null && <span className="text-slate-500">{c.duration} שניות</span>}
                {c.notes && <p className="mt-1 text-slate-600">{c.notes}</p>}
              </div>
              <span className="text-slate-400 text-xs">
                {new Date(c.createdAt).toLocaleString("he-IL")}
                {c.createdBy?.name && ` · ${c.createdBy.name}`}
              </span>
            </li>
          ))}
          {callLogs.length === 0 && <p className="text-sm text-slate-500">אין רישום שיחות. מוכן לחיבור למערכת טלפונית (API).</p>}
        </ul>
      </div>
    </div>
  );
}
