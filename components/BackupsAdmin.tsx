"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Download, Plus, RotateCcw, Trash2, ArrowRight } from "lucide-react";
import { usePolling } from "../lib/usePolling";

type BackupItem = {
  id: string;
  createdAt: string;
  createdBy?: { name: string } | null;
};

export default function BackupsAdmin() {
  const { data: session } = useSession();
  const router = useRouter();
  const role = (session?.user as { role?: string })?.role;
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchBackups = useCallback(() => {
    fetch("/api/admin/backups")
      .then((r) => r.json())
      .then((data) => {
        if (data.error && data.error === "לא מורשה") {
          router.replace("/admin");
          return;
        }
        setBackups(Array.isArray(data) ? data : []);
      })
      .catch(() => setBackups([]))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (role !== "admin") {
      router.replace("/admin");
      return;
    }
    fetchBackups();
  }, [role, router, fetchBackups]);
  usePolling(role === "admin" ? fetchBackups : () => {}, []);

  const createBackup = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/admin/backups", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שגיאה");
      fetchBackups();
    } catch (err) {
      alert(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setCreating(false);
    }
  };

  const restoreBackup = async (id: string) => {
    if (!confirm("האם לשחזר מגיבוי זה? כל הנתונים הנוכחיים יימחקו!")) return;
    setRestoring(id);
    try {
      const res = await fetch(`/api/admin/backups/${id}/restore`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שגיאה");
      alert("השחזור הושלם בהצלחה");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "שגיאה בשחזור");
    } finally {
      setRestoring(null);
    }
  };

  const deleteBackup = async (id: string) => {
    if (!confirm("האם למחוק גיבוי זה?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/backups/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("שגיאה");
      fetchBackups();
    } catch {
      alert("שגיאה במחיקה");
    } finally {
      setDeleting(null);
    }
  };

  if (role !== "admin") {
    return (
      <div className="p-8">
        <div className="animate-pulse h-64 rounded bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline">
          <ArrowRight className="h-4 w-4" />
          חזרה לניהול
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-800">גיבויים ושחזור</h1>
        <p className="mt-1 text-slate-600">רק מנהלים יכולים לראות ולשחזר גיבויים</p>
      </div>

      <div className="mb-6">
        <button
          onClick={createBackup}
          disabled={creating}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {creating ? "יוצר גיבוי..." : "צור גיבוי עכשיו"}
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8">
            <div className="h-24 animate-pulse rounded bg-slate-200" />
          </div>
        ) : backups.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            אין גיבויים. לחץ על "צור גיבוי עכשיו" ליצירת גיבוי ראשון.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">תאריך</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">נוצר ע״י</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {backups.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm text-slate-800">
                    {new Date(b.createdAt).toLocaleString("he-IL")}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {b.createdBy?.name ?? "—"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 justify-end">
                      <a
                        href={`/api/admin/backups/${b.id}`}
                        download
                        className="flex items-center gap-1 rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
                      >
                        <Download className="h-4 w-4" />
                        הורד
                      </a>
                      <button
                        onClick={() => restoreBackup(b.id)}
                        disabled={!!restoring}
                        className="flex items-center gap-1 rounded border border-amber-300 px-3 py-1.5 text-sm text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                      >
                        <RotateCcw className="h-4 w-4" />
                        {restoring === b.id ? "משחזר..." : "שחזר"}
                      </button>
                      <button
                        onClick={() => deleteBackup(b.id)}
                        disabled={!!deleting}
                        className="flex items-center gap-1 rounded border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        {deleting === b.id ? "..." : "מחק"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
