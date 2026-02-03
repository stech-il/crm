"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, CheckSquare, MessageSquare, Paperclip } from "lucide-react";
import CollapsibleSection from "./CollapsibleSection";

type Customer = {
  id: string;
  name: string;
  primaryPhone: string | null;
  settlement: string | null;
  manager: { name: string } | null;
  tasks: { id: string; title: string; completed: boolean; dueDate: string | null }[];
  activities: { id: string; type: string; title: string | null; content: string | null; createdAt: string }[];
};

export default function CustomerDetail() {
  const routerParams = useParams();
  const id = routerParams?.id as string;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/customers/${id}`)
      .then((r) => r.json())
      .then(setCustomer);
  }, [id]);

  const addNote = async () => {
    if (!note.trim()) return;
    await fetch(`/api/customers/${id}/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "note", content: note }),
    });
    setNote("");
    const res = await fetch(`/api/customers/${id}`);
    setCustomer(await res.json());
  };

  if (!customer) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-slate-200" />
          <div className="h-64 rounded bg-slate-200" />
        </div>
      </div>
    );
  }

  const openTasks = customer.tasks?.filter((t) => !t.completed) ?? [];

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/customers" className="text-sm text-primary-600 hover:underline">
            ← חזרה ללקוחות
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-800">{customer.name}</h1>
        </div>
        <Link
          href={`/customers/${id}/edit`}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Pencil className="h-4 w-4" />
          עריכה
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex gap-2 border-b border-slate-200 pb-2">
              <button className="flex items-center gap-1 rounded px-2 py-1 text-sm text-primary-600">
                <MessageSquare className="h-4 w-4" />
                הערה
              </button>
              <button className="flex items-center gap-1 rounded px-2 py-1 text-sm text-slate-500">
                <Paperclip className="h-4 w-4" />
                קובץ
              </button>
            </div>
            <textarea
              placeholder="כתוב הערה..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
            <button
              onClick={addNote}
              className="mt-2 rounded-lg bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700"
            >
              הוסף הערה
            </button>
          </div>

          {openTasks.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 font-semibold">
                <CheckSquare className="h-5 w-5 text-emerald-500" />
                משימות פתוחות ({openTasks.length})
              </h2>
              <ul className="space-y-2">
                {openTasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span>{t.title}</span>
                    {t.dueDate && (
                      <span className="text-sm text-slate-500">
                        {new Date(t.dueDate).toLocaleString("he-IL")}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-4">
            {customer.activities?.map((a) => (
              <div
                key={a.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="text-sm text-slate-600">{a.content ?? a.title}</p>
                <p className="mt-2 text-xs text-slate-400">
                  {new Date(a.createdAt).toLocaleString("he-IL")}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <CollapsibleSection title="מידע שימושי" defaultOpen={true}>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-slate-500">טלפון</dt>
                <dd>{customer.primaryPhone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">ישוב</dt>
                <dd>{customer.settlement ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">מנהל לקוח</dt>
                <dd>{customer.manager?.name ?? "—"}</dd>
              </div>
            </dl>
          </CollapsibleSection>
        </div>
      </div>
    </div>
  );
}
