"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Pencil, FileDown, Plus, Check, Trash2, Phone, MessageSquare, Activity, Copy } from "lucide-react";
import { formatFieldValue, formatFieldValueForTitle, isFileValue } from "../lib/formatFieldValue";
import { usePolling } from "../lib/usePolling";

type FieldDef = { id: string; name: string; label: string; type: string; showInCard?: boolean };
type Entity = { id: string; name: string; slug: string; fields: FieldDef[] };
type Task = { id: string; title: string; done: boolean; order: number };
type CallLog = { id: string; phoneNumber: string; direction: string; duration?: number; notes?: string; createdAt: string; createdBy?: { name: string } };
type ActivityItem = { id: string; type: string; content: string | null; createdAt: string; createdBy?: { name: string } | null };
type Note = { id: string; content: string; createdAt: string; createdBy?: { name: string } | null };
type DynamicRecordData = {
  id: string;
  data: Record<string, unknown>;
  updatedAt: string;
  createdBy?: { id: string; name: string } | null;
  tasks?: Task[];
  callLogs?: CallLog[];
  activities?: ActivityItem[];
  notes?: Note[];
};

const ACTIVITY_LABELS: Record<string, string> = {
  created: "נוצרה הרשומה",
  updated: "עודכנה הרשומה",
  task_added: "נוספה משימה",
  task_done: "הושלמה משימה",
  task_undone: "בוטל סיום משימה",
  call_added: "נרשמה שיחה",
  note_added: "נוספה הערה",
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
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState("");
  const [newCallPhone, setNewCallPhone] = useState("");
  const [newCallNotes, setNewCallNotes] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");

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
    setEditingTaskId(null);
    fetchData();
  };

  const startEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTaskTitle(task.title);
  };

  const saveEditTask = async () => {
    if (!editingTaskId || !editingTaskTitle.trim()) return;
    await fetch(`/api/dynamic/${entitySlug}/${recordId}/tasks/${editingTaskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editingTaskTitle.trim() }),
    });
    setEditingTaskId(null);
    setEditingTaskTitle("");
    fetchData();
  };

  const cancelEditTask = () => {
    setEditingTaskId(null);
    setEditingTaskTitle("");
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

  const addNote = async () => {
    if (!newNoteContent.trim()) return;
    await fetch(`/api/dynamic/${entitySlug}/${recordId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newNoteContent.trim() }),
    });
    setNewNoteContent("");
    fetchData();
  };

  const duplicateRecord = async () => {
    const res = await fetch(`/api/dynamic/${entitySlug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: record?.data }),
    });
    const newRecord = await res.json();
    if (newRecord?.id) window.location.href = `/dynamic/${entitySlug}/${newRecord.id}`;
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
  const activities = record.activities || [];
  const notes = record.notes || [];

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
        <div className="flex gap-2">
          <button
            onClick={duplicateRecord}
            className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <Copy className="h-4 w-4" />
            שכפל
          </button>
          <Link
            href={`/dynamic/${entitySlug}/${recordId}/edit`}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Pencil className="h-4 w-4" />
            עריכה
          </Link>
        </div>
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
                  : f.type === "phone" && typeof data[f.name] === "string"
                    ? (
                        <a href={`tel:${String(data[f.name]).replace(/\D/g, "")}`} className="inline-flex items-center gap-1.5 text-primary-600 hover:underline">
                          <Phone className="h-4 w-4" />
                          {formatFieldValue(data[f.name], f.type)}
                        </a>
                      )
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
              {editingTaskId === t.id ? (
                <>
                  <input
                    type="text"
                    value={editingTaskTitle}
                    onChange={(e) => setEditingTaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEditTask();
                      if (e.key === "Escape") cancelEditTask();
                    }}
                    className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
                    autoFocus
                  />
                  <button onClick={saveEditTask} className="rounded bg-primary-600 px-2 py-1 text-xs text-white hover:bg-primary-700">
                    שמור
                  </button>
                  <button onClick={cancelEditTask} className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100">
                    ביטול
                  </button>
                </>
              ) : (
                <>
                  <span className={`flex-1 ${t.done ? "text-slate-500 line-through" : ""}`}>{t.title}</span>
                  <button onClick={() => startEditTask(t)} className="p-1 text-slate-400 hover:text-primary-600" title="עריכה">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => deleteTask(t.id)} className="p-1 text-slate-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
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
              <a href={`tel:${c.phoneNumber.replace(/\D/g, "")}`} className="flex items-center gap-2 text-primary-600 hover:text-primary-700" title="התקשר">
                <Phone className="h-4 w-4" />
              </a>
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

      {/* הערות */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">הערות</h2>
        <div className="mb-4 flex gap-2">
          <textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="הוסף הערה..."
            rows={2}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm resize-none"
          />
          <button
            onClick={addNote}
            className="self-end flex items-center gap-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            <MessageSquare className="h-4 w-4" />
            הוסף
          </button>
        </div>
        <ul className="space-y-2">
          {notes.map((n) => (
            <li key={n.id} className="rounded-lg bg-slate-50 p-3 text-sm">
              <p className="text-slate-800 whitespace-pre-wrap">{n.content}</p>
              <span className="text-slate-400 text-xs mt-1 block">
                {new Date(n.createdAt).toLocaleString("he-IL")}
                {n.createdBy?.name && ` · ${n.createdBy.name}`}
              </span>
            </li>
          ))}
          {notes.length === 0 && <p className="text-sm text-slate-500">אין הערות</p>}
        </ul>
      </div>

      {/* ציר זמן פעילות */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Activity className="h-5 w-5" />
          פעילות
        </h2>
        <ul className="space-y-3">
          {activities.map((a) => (
            <li key={a.id} className="flex items-start gap-3 text-sm">
              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-500" />
              <div>
                <span className="font-medium text-slate-700">{ACTIVITY_LABELS[a.type] || a.type}</span>
                {a.content && <span className="text-slate-600 mr-1"> – {a.content}</span>}
                <span className="text-slate-400 text-xs">
                  {new Date(a.createdAt).toLocaleString("he-IL")}
                  {a.createdBy?.name && ` · ${a.createdBy.name}`}
                </span>
              </div>
            </li>
          ))}
          {activities.length === 0 && <p className="text-sm text-slate-500">אין פעילות</p>}
        </ul>
      </div>
    </div>
  );
}
