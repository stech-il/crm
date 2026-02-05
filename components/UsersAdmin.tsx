"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Users, Pencil, Trash2 } from "lucide-react";
import Modal from "./Modal";

type UserItem = {
  id: string;
  name: string;
  email: string | null;
  role: string;
  createdAt: string;
};

export default function UsersAdmin() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<UserItem | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchUsers = () => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((list) => setUsers(Array.isArray(list) ? list : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => fetchUsers(), []);

  const openModal = (user?: UserItem) => {
    if (user) {
      setEditingUser(user);
      setForm({ name: user.name, email: user.email || "", password: "", role: user.role });
    } else {
      setEditingUser(null);
      setForm({ name: "", email: "", password: "", role: "user" });
    }
    setError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingUser(null);
    setError("");
  };

  const submitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.email.trim()) {
      setError("נא למלא שם ואימייל");
      return;
    }
    if (!editingUser && form.password.length < 6) {
      setError("סיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }
    setSubmitting(true);
    try {
      if (editingUser) {
        const body: Record<string, unknown> = {
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
        };
        if (form.password) body.password = form.password;
        const res = await fetch(`/api/users/${editingUser.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "שגיאה");
      } else {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
            role: form.role,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "שגיאה");
      }
      closeModal();
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteUser = async () => {
    if (!deleteConfirm) return;
    await fetch(`/api/users/${deleteConfirm.id}`, { method: "DELETE" });
    setDeleteConfirm(null);
    fetchUsers();
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse h-64 rounded bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">
          <Users className="inline h-8 w-8 ml-2" />
          ניהול משתמשים
        </h1>
        <div className="flex gap-2">
          <Link
            href="/admin"
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            ← ישויות
          </Link>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            הוסף משתמש
          </button>
        </div>
      </div>

      <p className="mb-6 text-slate-600">
        הוספה, עריכה ומחיקה של משתמשים במערכת. משתמשים עם תפקיד אדמין יכולים לגשת ללוח הניהול.
      </p>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">שם</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">אימייל</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">תפקיד</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">נוצר</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-800">{user.name}</td>
                <td className="px-6 py-4 text-slate-600">{user.email || "—"}</td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      user.role === "admin" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {user.role === "admin" ? "אדמין" : "משתמש"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {new Date(user.createdAt).toLocaleDateString("he-IL")}
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => openModal(user)}
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                      title="ערוך"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(user)}
                      className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                      title="מחק"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="py-16 text-center text-slate-500">אין משתמשים. הוסף משתמש ראשון.</div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingUser ? "עריכת משתמש" : "הוספת משתמש"}
      >
        <form onSubmit={submitUser} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">שם מלא</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="ישראל ישראלי"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">אימייל</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="user@example.com"
              disabled={!!editingUser}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:bg-slate-100"
              required
            />
            {editingUser && (
              <p className="mt-1 text-xs text-slate-500">אימייל לא ניתן לשינוי</p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              סיסמה {editingUser && "(השאר ריק כדי לא לשנות)"}
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder={editingUser ? "••••••••" : "לפחות 6 תווים"}
              minLength={editingUser ? 0 : 6}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">תפקיד</label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="user">משתמש</option>
              <option value="admin">אדמין</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-primary-600 py-2.5 font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {submitting ? "שומר..." : editingUser ? "עדכן" : "צור משתמש"}
            </button>
            <button
              type="button"
              onClick={closeModal}
              className="rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-600 hover:bg-slate-50"
            >
              ביטול
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="מחיקת משתמש"
      >
        {deleteConfirm && (
          <div className="space-y-4">
            <p className="text-slate-600">
              האם למחוק את המשתמש &quot;{deleteConfirm.name}&quot;? פעולה זו לא ניתנת לביטול.
            </p>
            <div className="flex gap-2">
              <button
                onClick={deleteUser}
                className="flex-1 rounded-lg bg-red-600 py-2.5 font-medium text-white hover:bg-red-700"
              >
                מחק
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-600 hover:bg-slate-50"
              >
                ביטול
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
