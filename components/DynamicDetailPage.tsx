"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";

type FieldDef = { id: string; name: string; label: string; type: string };
type Entity = { id: string; name: string; slug: string; fields: FieldDef[] };
type DynamicRecordData = { id: string; data: Record<string, unknown>; updatedAt: string };

export default function DynamicDetailPage({
  entitySlug,
  recordId,
}: {
  entitySlug: string;
  recordId: string;
}) {
  const router = useRouter();
  const [entity, setEntity] = useState<Entity | null>(null);
  const [record, setRecord] = useState<DynamicRecordData | null>(null);

  useEffect(() => {
    fetch(`/api/dynamic/${entitySlug}/${recordId}`)
      .then((r) => r.json())
      .then((res) => {
        setEntity(res.entity);
        setRecord(res.record);
      });
  }, [entitySlug, recordId]);

  if (!entity || !record) {
    return (
      <div className="p-8">
        <div className="animate-pulse h-64 rounded bg-slate-200" />
      </div>
    );
  }

  const data = record.data as Record<string, unknown>;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href={`/dynamic/${entitySlug}`} className="text-sm text-primary-600 hover:underline">
            ← חזרה ל{entity.name}
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-800">
            {String(data[entity.fields[0]?.name] ?? record.id.slice(0, 8) ?? "רשומה")}
          </h1>
        </div>
        <Link
          href={`/dynamic/${entitySlug}/${recordId}/edit`}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Pencil className="h-4 w-4" />
          עריכה
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <dl className="grid gap-4 sm:grid-cols-2">
          {entity.fields.map((f) => (
            <div key={f.id}>
              <dt className="text-sm font-medium text-slate-500">{f.label}</dt>
              <dd className="mt-1 text-slate-800">
                {f.type === "checkbox"
                  ? data[f.name]
                    ? "כן"
                    : "לא"
                  : String(data[f.name] ?? "—")}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
