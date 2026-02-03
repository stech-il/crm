"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DynamicForm from "./DynamicForm";

type Entity = {
  id: string;
  name: string;
  slug: string;
  fields: unknown[];
};

export default function DynamicFormPage({
  entitySlug,
  recordId,
}: {
  entitySlug: string;
  recordId?: string;
}) {
  const router = useRouter();
  const [entity, setEntity] = useState<Entity | null>(null);
  const [initialData, setInitialData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (recordId) {
      fetch(`/api/dynamic/${entitySlug}/${recordId}`)
        .then((r) => r.json())
        .then((res) => {
          setEntity(res.entity);
          setInitialData((res.record?.data as Record<string, unknown>) || {});
        });
    } else {
      fetch(`/api/dynamic/${entitySlug}`)
        .then((r) => r.json())
        .then((res) => {
          setEntity(res.entity);
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
