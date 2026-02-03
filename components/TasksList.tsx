"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, CheckSquare } from "lucide-react";

type Task = {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string | null;
  customer: { id: string; name: string } | null;
  assignee: { name: string } | null;
};

export default function TasksList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const fetchTasks = () => {
    const params = new URLSearchParams();
    if (!showCompleted) params.set("completed", "false");
    fetch(`/api/tasks?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setTasks(data);
        setLoading(false);
      });
  };

  useEffect(() => fetchTasks(), [showCompleted]);

  const toggleComplete = async (task: Task) => {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !task.completed }),
    });
    fetchTasks();
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    });
    setNewTitle("");
    fetchTasks();
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-12 w-48 rounded bg-slate-200" />
          <div className="h-64 rounded bg-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">משימות</h1>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
          />
          <span className="text-sm">הצג הושלמו</span>
        </label>
      </div>

      <form onSubmit={addTask} className="mb-6 flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="משימה חדשה..."
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2"
        />
        <button
          type="submit"
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          הוסף
        </button>
      </form>

      <div className="space-y-2">
        {tasks.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <input
              type="checkbox"
              checked={t.completed}
              onChange={() => toggleComplete(t)}
              className="h-5 w-5 rounded"
            />
            <div className="flex-1">
              <p className={t.completed ? "text-slate-500 line-through" : "font-medium"}>{t.title}</p>
              <p className="text-sm text-slate-500">
                {t.customer && (
                  <Link href={`/customers/${t.customer.id}`} className="text-primary-600 hover:underline">
                    {t.customer.name}
                  </Link>
                )}
                {t.assignee && ` • ${t.assignee.name}`}
                {t.dueDate && ` • ${new Date(t.dueDate).toLocaleString("he-IL")}`}
              </p>
            </div>
          </div>
        ))}
      </div>
      {tasks.length === 0 && (
        <div className="py-16 text-center text-slate-500">אין משימות</div>
      )}
    </div>
  );
}
