"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Settings, ChevronDown } from "lucide-react";
import { FIELD_TYPES } from "../lib/fieldTypes";

type FieldDef = {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  section: string | null;
  order: number;
};

type Entity = {
  id: string;
  name: string;
  slug: string;
  fields: FieldDef[];
};

export default function AdminPanel() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [expandedEntity, setExpandedEntity] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEntities = () => {
    fetch("/api/admin/entities")
      .then((r) => r.json())
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        setEntities(arr);
        // פתח את הישות הראשונה אוטומטית אם אין ישות פתוחה
        if (arr.length > 0 && !expandedEntity) {
          setExpandedEntity(arr[0].id);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => fetchEntities(), []);

  const addEntity = async () => {
    const name = prompt("שם הישות (עברית):");
    const slug = prompt("מזהה (אנגלית, לדוגמה: customers):");
    if (!name || !slug) return;
    await fetch("/api/admin/entities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug }),
    });
    fetchEntities();
  };

  const addField = async (entityId: string) => {
    const typesList = FIELD_TYPES.map((t) => t.value).join(", ");
    const name = prompt("מזהה שדה (אנגלית, לדוגמה: name או primaryPhone):");
    const label = prompt("תווית בעברית (מה יוצג למשתמש):");
    const typeStr = prompt(
      `סוג שדה:\n${typesList}\n\nהזן סוג (ברירת מחדל: text):`,
      "text"
    );
    const type = typeStr && FIELD_TYPES.some((t) => t.value === typeStr) ? typeStr : "text";
    const section = prompt("קבוצה (אופציונלי, לדוגמה: מידע על הלקוח):");
    const required = confirm("שדה חובה?");
    if (!name || !label) return;
    await fetch(`/api/admin/entities/${entityId}/fields`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        label,
        type: type || "text",
        section: section || null,
        required,
        order: 999,
      }),
    });
    fetchEntities();
  };

  const updateField = async (fieldId: string, updates: Partial<FieldDef>) => {
    await fetch(`/api/admin/fields/${fieldId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    fetchEntities();
  };

  const deleteField = async (fieldId: string) => {
    if (!confirm("למחוק את השדה?")) return;
    await fetch(`/api/admin/fields/${fieldId}`, { method: "DELETE" });
    fetchEntities();
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
          <Settings className="inline h-8 w-8 ml-2" />
          ניהול מערכת - הגדרת שדות
        </h1>
        <button
          onClick={addEntity}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          הוסף ישות
        </button>
      </div>

      <p className="mb-6 text-slate-600">
        כאן מגדירים ישויות (סוגי רשומות) ושדות. כל שדה ניתן להגדרה דינמית - טקסט, מספר, תאריך, בחירה מרשימה, העלאת קבצים ועוד.
      </p>

      {entities.length === 0 && (
        <div className="mb-6 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="mb-4 text-slate-600">אין עדיין ישויות. לחץ על &quot;הוסף ישות&quot; כדי להתחיל.</p>
          <button
            onClick={addEntity}
            className="rounded-lg bg-primary-600 px-6 py-3 font-medium text-white hover:bg-primary-700"
          >
            + הוסף ישות ראשונה
          </button>
        </div>
      )}

      <div className="space-y-4">
        {entities.map((entity) => (
          <div
            key={entity.id}
            className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
          >
            <button
              onClick={() => setExpandedEntity(expandedEntity === entity.id ? null : entity.id)}
              className="flex w-full items-center justify-between p-4 text-right hover:bg-slate-50"
            >
              <div className="flex items-center gap-4">
                <span className="font-semibold text-slate-800">{entity.name}</span>
                <span className="text-sm text-slate-500">/{entity.slug}</span>
                <span className="text-xs text-slate-400">
                  {entity.fields.length} שדות
                </span>
                <Link
                  href={`/dynamic/${entity.slug}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm text-primary-600 hover:underline"
                >
                  צפה ברשומות
                </Link>
              </div>
              <ChevronDown
                className={`h-5 w-5 shrink-0 transition-transform ${expandedEntity === entity.id ? "rotate-180" : ""}`}
                aria-label={expandedEntity === entity.id ? "סגור" : "פתח שדות"}
              />
            </button>

            {expandedEntity === entity.id && (
              <div className="border-t border-slate-200 p-4 bg-slate-50">
                <div className="mb-4 flex justify-between">
                  <h3 className="font-medium text-slate-700">שדות</h3>
                  <button
                    onClick={() => addField(entity.id)}
                    className="text-sm text-primary-600 hover:underline"
                  >
                    + הוסף שדה
                  </button>
                </div>
                <ul className="space-y-2">
                  {entity.fields.map((field) => (
                    <li
                      key={field.id}
                      className="flex items-center justify-between rounded-lg bg-white p-3"
                    >
                      <div>
                        <span className="font-medium">{field.label}</span>
                        <span className="mr-2 text-sm text-slate-500">({field.name})</span>
                        <span className="text-xs bg-slate-200 px-2 py-0.5 rounded">
                          {FIELD_TYPES.find((t) => t.value === field.type)?.label ?? field.type}
                        </span>
                        {field.required && <span className="text-red-500 mr-1">•</span>}
                        {field.section && (
                          <span className="text-xs text-slate-400">| {field.section}</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const newLabel = prompt("תווית חדשה:", field.label);
                            if (newLabel) updateField(field.id, { label: newLabel });
                          }}
                          className="text-sm text-slate-500 hover:text-slate-700"
                        >
                          ערוך
                        </button>
                        <button
                          onClick={() => deleteField(field.id)}
                          className="text-sm text-red-500 hover:text-red-700"
                        >
                          מחק
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                {entity.fields.length === 0 && (
                  <div className="py-6 text-center">
                    <p className="mb-4 text-slate-500">אין עדיין שדות. הוסף שדה כדי ליצור רשומות.</p>
                    <button
                      onClick={() => addField(entity.id)}
                      className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                    >
                      + הוסף שדה ראשון
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
