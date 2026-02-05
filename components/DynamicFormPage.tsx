"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  const [entity, setEntity] = useState<DynamicEntity | null>(null);
  const [initialData, setInitialData] = useState<Record<string, unknown>>({});

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
    }
  }, [entitySlug, recordId]);

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
      <DynamicForm
        entity={entity}
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </div>
  );
}
