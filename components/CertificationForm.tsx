"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

type User = { id: string; name: string };

export default function CertificationForm() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(!!id);
  const [form, setForm] = useState({
    company: "",
    name: "",
    field: "",
    certifiedOn: "",
    status: "",
    issueDate: "",
    issueDateHebrew: "",
    endDate: "",
    endDateHebrew: "",
    contactPerson: "",
    additionalContact: "",
    bonded: false,
    shortModelName: "",
    userId: "",
  });

  useEffect(() => {
    fetch("/api/users").then((r) => r.json()).then(setUsers);
  }, []);

  useEffect(() => {
    if (!id || id === "new") {
      setLoading(false);
      return;
    }
    fetch(`/api/certifications/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          company: data.company ?? "",
          name: data.name ?? "",
          field: data.field ?? "",
          certifiedOn: data.certifiedOn ?? "",
          status: data.status ?? "",
          issueDate: data.issueDate ?? "",
          issueDateHebrew: data.issueDateHebrew ?? "",
          endDate: data.endDate ? new Date(data.endDate).toISOString().slice(0, 10) : "",
          endDateHebrew: data.endDateHebrew ?? "",
          contactPerson: data.contactPerson ?? "",
          additionalContact: data.additionalContact ?? "",
          bonded: data.bonded ?? false,
          shortModelName: data.shortModelName ?? "",
          userId: data.userId ?? "",
        });
        setLoading(false);
      });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      userId: form.userId || null,
    };
    if (id && id !== "new") {
      await fetch(`/api/certifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      router.push(`/certifications/${id}`);
    } else {
      const res = await fetch("/api/certifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      router.push(`/certifications/${data.id}`);
    }
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
      <h1 className="mb-6 text-2xl font-bold text-slate-800">אישור כשרות</h1>
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-600">חברה *</label>
            <input
              required
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600">שם *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600">תחום</label>
            <select
              value={form.field}
              onChange={(e) => setForm({ ...form, field: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">בחר...</option>
              <option value="מקפיאים">מקפיאים</option>
              <option value="מזגנים">מזגנים</option>
              <option value="מיחם">מיחם</option>
              <option value="פלתט שבת">פלתט שבת</option>
              <option value="קולר">קולר</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600">אישור על</label>
            <select
              value={form.certifiedOn}
              onChange={(e) => setForm({ ...form, certifiedOn: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">בחר...</option>
              <option value="מצב שבת">מצב שבת</option>
              <option value="מכני">מכני</option>
              <option value="אין טרמוסטט">אין טרמוסטט</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600">סטטוס אישור</label>
            <input
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              placeholder="מוצר עדיין לא בשוק"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600">תאריך הנפקה</label>
            <input
              value={form.issueDateHebrew}
              onChange={(e) => setForm({ ...form, issueDateHebrew: e.target.value })}
              placeholder="כא' אלול תשפ\"ה"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600">תאריך סיום לועזי</label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600">תאריך סיום עברי</label>
            <input
              value={form.endDateHebrew}
              onChange={(e) => setForm({ ...form, endDateHebrew: e.target.value })}
              placeholder="כא' כסלו תשפ\"ז"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600">איש קשר</label>
            <input
              value={form.contactPerson}
              onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600">משתמש</label>
            <select
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">בחר...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700"
          >
            שמור
          </button>
          <Link
            href={id ? `/certifications/${id}` : "/certifications"}
            className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-600 hover:bg-slate-50"
          >
            בטל
          </Link>
        </div>
      </form>
    </div>
  );
}
