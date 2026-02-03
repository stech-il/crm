"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Pencil, MessageSquare } from "lucide-react";
import CollapsibleSection from "./CollapsibleSection";

type Certification = {
  id: string;
  company: string;
  name: string;
  field: string | null;
  certifiedOn: string | null;
  status: string | null;
  issueDate: string | null;
  issueDateHebrew: string | null;
  endDate: string | null;
  endDateHebrew: string | null;
  contactPerson: string | null;
  user: { name: string } | null;
  activities: { id: string; type: string; content: string | null; createdAt: string }[];
};

export default function CertificationDetail() {
  const params = useParams();
  const id = params?.id as string;
  const [cert, setCert] = useState<Certification | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/certifications/${id}`).then((r) => r.json()).then(setCert);
  }, [id]);

  const addNote = async () => {
    if (!note.trim()) return;
    await fetch(`/api/certifications/${id}/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "note", content: note }),
    });
    setNote("");
    const res = await fetch(`/api/certifications/${id}`);
    setCert(await res.json());
  };

  if (!cert) {
    return (
      <div className="p-8">
        <div className="animate-pulse h-64 rounded bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/certifications" className="text-sm text-primary-600 hover:underline">
            ← חזרה לאישורים
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-800">
            {cert.company}: {cert.name}
          </h1>
        </div>
        <Link
          href={`/certifications/${id}/edit`}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Pencil className="h-4 w-4" />
          עריכה
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
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
          {cert.activities?.map((a) => (
            <div key={a.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm">{a.content}</p>
              <p className="mt-2 text-xs text-slate-400">
                {new Date(a.createdAt).toLocaleString("he-IL")}
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <CollapsibleSection title="מידע שימושי" defaultOpen={true}>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-slate-500">תחום</dt><dd>{cert.field ?? "—"}</dd></div>
              <div><dt className="text-slate-500">אישור על</dt><dd>{cert.certifiedOn ?? "—"}</dd></div>
              <div><dt className="text-slate-500">סטטוס אישור</dt><dd>{cert.status ?? "—"}</dd></div>
              <div><dt className="text-slate-500">תאריך הנפקה</dt><dd>{cert.issueDateHebrew ?? cert.issueDate ?? "—"}</dd></div>
              <div><dt className="text-slate-500">תאריך סיום לועזי</dt><dd>{cert.endDate ? new Date(cert.endDate).toLocaleDateString("he-IL") : "—"}</dd></div>
              <div><dt className="text-slate-500">תאריך סיום עברי</dt><dd>{cert.endDateHebrew ?? "—"}</dd></div>
              <div><dt className="text-slate-500">משתמש</dt><dd>{cert.user?.name ?? "—"}</dd></div>
            </dl>
          </CollapsibleSection>
          <CollapsibleSection title="פרטי איש קשר" defaultOpen={false}>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-slate-500">איש קשר</dt><dd>{cert.contactPerson ?? "—"}</dd></div>
            </dl>
          </CollapsibleSection>
        </div>
      </div>
    </div>
  );
}
