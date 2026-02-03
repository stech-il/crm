"use client";

import { useEffect, useState } from "react";
import DynamicField from "./DynamicField";
import CollapsibleSection from "./CollapsibleSection";
import type { DynamicEntity } from "../lib/dynamicTypes";

type Props = {
  entity: DynamicEntity;
  initialData?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel?: () => void;
};

export default function DynamicForm({ entity, initialData = {}, onSubmit, onCancel }: Props) {
  const [data, setData] = useState<Record<string, unknown>>(initialData);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then(setUsers)
      .catch(() => {});
  }, []);

  const sections = Array.from(new Set(entity.fields.map((f) => f.section || "כללי")));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSubmit(data);
    setSaving(false);
  };

  const updateField = (name: string, value: unknown) => {
    setData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {sections.map((section) => {
        const sectionFields = entity.fields
          .filter((f) => (f.section || "כללי") === section)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        if (sectionFields.length === 0) return null;

        return (
          <CollapsibleSection key={section} title={section} defaultOpen={true}>
            <div className="grid gap-4 md:grid-cols-2">
              {sectionFields.map((field) => (
                <DynamicField
                  key={field.id}
                  field={field}
                  value={data[field.name]}
                  onChange={(v) => updateField(field.name, v)}
                  users={users}
                />
              ))}
            </div>
          </CollapsibleSection>
        );
      })}

      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? "שומר..." : "שמור"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-600 hover:bg-slate-50"
          >
            בטל
          </button>
        )}
      </div>
    </form>
  );
}
