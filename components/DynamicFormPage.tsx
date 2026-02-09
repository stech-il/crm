"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import DynamicForm from "./DynamicForm";
import { normalizeEntity, type DynamicEntity } from "../lib/dynamicTypes";

export default function DynamicFormPage({
  entitySlug,
  recordId,
}: {
  entitySlug: string;
  recordId?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateIdFromUrl = searchParams.get("template");
  const [entity, setEntity] = useState<DynamicEntity | null>(null);
  const [initialData, setInitialData] = useState<Record<string, unknown>>({});
  const [templates, setTemplates] = useState<{ id: string; name: string; data: object }[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  useEffect(() => {
    if (recordId) {
      fetch(`/api/dynamic/${entitySlug}/${recordId}`)
        .then((r) => r.json())
        .then((res) => {
          if (res.entity) setEntity(normalizeEntity(res.entity));
          setInitialData((res.record?.data as Record<string, unknown>) || {});
        });
    } else {
      fetch(`/api/dynamic/${entitySlug}`)
        .then((r) => r.json())
        .then((res) => {
          if (res.entity) setEntity(normalizeEntity(res.entity));
        });
      fetch(`/api/dynamic/${entitySlug}/templates`)
        .then((r) => r.json())
        .then((t) => {
          const arr = Array.isArray(t) ? t : [];
          setTemplates(arr);
          if (templateIdFromUrl && arr.some((x: { id: string }) => x.id === templateIdFromUrl)) {
            const tmpl = arr.find((x: { id: string; data: object }) => x.id === templateIdFromUrl);
            if (tmpl) {
              setSelectedTemplateId(templateIdFromUrl);
              setInitialData((tmpl.data as Record<string, unknown>) || {});
            }
          }
        })
        .catch(() => setTemplates([]));
    }
  }, [entitySlug, recordId, templateIdFromUrl]);

  const deleteTemplate = async (templateId: string) => {
    if (!confirm("למחוק תבנית זו?")) return;
    await fetch(`/api/dynamic/${entitySlug}/templates/${templateId}`, { method: "DELETE" });
    setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    if (selectedTemplateId === templateId) {
      setSelectedTemplateId("");
      setInitialData({});
    }
  };

  const handleSubmit = async (data: Record<string, unknown>) => {
    if (recordId) {
      await fetch(`/api/dynamic/${entitySlug}/${recordId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      router.push(`/dynamic/${entitySlug}/${recordId}`);
    } else {
      const res = await fetch(`/api/dynamic/${entitySlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      const record = await res.json();
      router.push(`/dynamic/${entitySlug}/${record.id}`);
    }
  };

  if (!entity) {
    return (
      <div className="p-8">
        <div className="animate-pulse h-64 rounded bg-slate-200" />
      </div>
    );
  }

  if (!entity.fields || entity.fields.length === 0) {
    return (
      <div className="p-8">
        <h1 className="mb-4 text-2xl font-bold text-slate-800">
          {recordId ? "עריכה" : "חדש"} - {entity.name}
        </h1>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <p className="text-amber-800">
            אין שדות מוגדרים. הוסף שדות בלוח הניהול לפני יצירת רשומות.
          </p>
          <Link
            href="/admin"
            className="mt-4 inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            עבור לניהול
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-800">
        {recordId ? "עריכה" : "חדש"} - {entity.name}
      </h1>
      {!recordId && templates.length > 0 && (
        <div className="mb-6 flex items-center gap-2">
          <span className="text-sm text-slate-600">תבנית:</span>
          <select
            value={selectedTemplateId}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedTemplateId(id);
              const t = templates.find((x) => x.id === id);
              if (t) setInitialData((t.data as Record<string, unknown>) || {});
              else setInitialData({});
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">ריק</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {selectedTemplateId && (
            <button
              type="button"
              onClick={() => deleteTemplate(selectedTemplateId)}
              className="flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1.5 text-sm text-red-600 hover:bg-red-50"
              title="מחק תבנית"
            >
              <Trash2 className="h-4 w-4" />
              מחק תבנית
            </button>
          )}
        </div>
      )}
      <DynamicForm
        entity={entity}
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </div>
  );
}
