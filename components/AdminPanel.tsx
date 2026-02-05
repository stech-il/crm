"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Settings, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { FIELD_TYPES } from "../lib/fieldTypes";
import Modal from "./Modal";

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

  // מודלים
  const [entityModalOpen, setEntityModalOpen] = useState(false);
  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [fieldModalEntityId, setFieldModalEntityId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<FieldDef | null>(null);
  const [deleteConfirmField, setDeleteConfirmField] = useState<FieldDef | null>(null);

  // טופס ישות
  const [entityForm, setEntityForm] = useState({ name: "", slug: "" });
  const [entitySubmitting, setEntitySubmitting] = useState(false);
  const [entityError, setEntityError] = useState("");

  // טופס שדה
  const [fieldForm, setFieldForm] = useState({
    name: "",
    label: "",
    type: "text",
    section: "",
    required: false,
  });
  const [fieldSubmitting, setFieldSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState("");

  const fetchEntities = () => {
    fetch("/api/admin/entities")
      .then((r) => r.json())
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        setEntities(arr);
        if (arr.length > 0 && !expandedEntity) {
          setExpandedEntity(arr[0].id);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => fetchEntities(), []);

  const openEntityModal = () => {
    setEntityForm({ name: "", slug: "" });
    setEntityError("");
    setEntityModalOpen(true);
  };

  const openFieldModal = (entityId: string, field?: FieldDef) => {
    setFieldModalEntityId(entityId);
    setEditingField(field ?? null);
    setFieldForm(
      field
        ? {
            name: field.name,
            label: field.label,
            type: field.type,
            section: field.section || "",
            required: field.required,
          }
        : { name: "", label: "", type: "text", section: "", required: false }
    );
    setFieldError("");
    setFieldModalOpen(true);
  };

  const closeEntityModal = () => {
    setEntityModalOpen(false);
    setEntityError("");
  };

  const closeFieldModal = () => {
    setFieldModalOpen(false);
    setFieldModalEntityId(null);
    setEditingField(null);
    setFieldError("");
  };

  const submitEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    setEntityError("");
    setEntitySubmitting(true);
    const slug = entityForm.slug.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (!entityForm.name.trim() || !slug) {
      setEntityError("נא למלא שם ומזהה");
      setEntitySubmitting(false);
      return;
    }
    try {
      const res = await fetch("/api/admin/entities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: entityForm.name.trim(), slug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שגיאה");
      closeEntityModal();
      fetchEntities();
    } catch (err) {
      setEntityError(err instanceof Error ? err.message : "שגיאה ביצירת ישות");
    } finally {
      setEntitySubmitting(false);
    }
  };

  const submitField = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError("");
    if (!fieldModalEntityId) return;
    const name = fieldForm.name.trim().replace(/\s+/g, "_");
    if (!name || !fieldForm.label.trim()) {
      setFieldError("נא למלא מזהה ותווית");
      return;
    }
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) {
      setFieldError("מזהה חייב להתחיל באות ולהכיל רק אותיות, מספרים ו-_");
      return;
    }
    setFieldSubmitting(true);
    try {
      if (editingField) {
        const res = await fetch(`/api/admin/fields/${editingField.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: fieldForm.label.trim(),
            type: fieldForm.type,
            section: fieldForm.section.trim() || null,
            required: fieldForm.required,
          }),
        });
        if (!res.ok) throw new Error("שגיאה בעדכון");
      } else {
        const res = await fetch(`/api/admin/entities/${fieldModalEntityId}/fields`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            label: fieldForm.label.trim(),
            type: fieldForm.type,
            section: fieldForm.section.trim() || null,
            required: fieldForm.required,
            order: 999,
          }),
        });
        if (!res.ok) throw new Error("שגיאה ביצירת שדה");
      }
      closeFieldModal();
      fetchEntities();
    } catch (err) {
      setFieldError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setFieldSubmitting(false);
    }
  };

  const deleteField = async () => {
    if (!deleteConfirmField) return;
    await fetch(`/api/admin/fields/${deleteConfirmField.id}`, { method: "DELETE" });
    setDeleteConfirmField(null);
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
          ניהול מערכת
        </h1>
        <button
          onClick={openEntityModal}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          הוסף ישות
        </button>
      </div>

      <p className="mb-6 text-slate-600">
        הגדרת ישויות ושדות. כל שדה ניתן להגדרה דינמית – טקסט, מספר, תאריך, בחירה מרשימה ועוד.
      </p>

      {entities.length === 0 && (
        <div className="mb-6 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <p className="mb-6 text-slate-600">אין עדיין ישויות. התחל ביצירת ישות ראשונה.</p>
          <button
            onClick={openEntityModal}
            className="rounded-lg bg-primary-600 px-6 py-3 font-medium text-white shadow-sm hover:bg-primary-700"
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
              className="flex w-full items-center justify-between p-4 text-right hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="font-semibold text-slate-800">{entity.name}</span>
                <span className="text-sm text-slate-500">/{entity.slug}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                  {entity.fields.length} שדות
                </span>
                <Link
                  href={`/dynamic/${entity.slug}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
                >
                  צפה ברשומות
                </Link>
              </div>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${expandedEntity === entity.id ? "rotate-180" : ""}`}
              />
            </button>

            {expandedEntity === entity.id && (
              <div className="border-t border-slate-200 bg-slate-50/50 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-medium text-slate-700">שדות</h3>
                  <button
                    onClick={() => openFieldModal(entity.id)}
                    className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
                  >
                    <Plus className="h-4 w-4" />
                    הוסף שדה
                  </button>
                </div>
                {entity.fields.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-white py-10 text-center">
                    <p className="mb-4 text-slate-500">אין שדות. הוסף שדה כדי ליצור רשומות.</p>
                    <button
                      onClick={() => openFieldModal(entity.id)}
                      className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                    >
                      + הוסף שדה ראשון
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {entity.fields.map((field) => (
                      <div
                        key={field.id}
                        className="flex items-center justify-between rounded-lg bg-white border border-slate-200 p-3 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-slate-800">{field.label}</span>
                          <span className="text-sm text-slate-500 font-mono">{field.name}</span>
                          <span className="rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                            {FIELD_TYPES.find((t) => t.value === field.type)?.label ?? field.type}
                          </span>
                          {field.required && (
                            <span className="text-xs text-red-600 font-medium">חובה</span>
                          )}
                          {field.section && (
                            <span className="text-xs text-slate-400">• {field.section}</span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openFieldModal(entity.id, field)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                            title="ערוך"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmField(field)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                            title="מחק"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* מודל הוספת ישות */}
      <Modal isOpen={entityModalOpen} onClose={closeEntityModal} title="הוספת ישות">
        <form onSubmit={submitEntity} className="space-y-4">
          {entityError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{entityError}</div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">שם (עברית)</label>
            <input
              type="text"
              value={entityForm.name}
              onChange={(e) => {
                const name = e.target.value;
                setEntityForm((f) => {
                  const next = { ...f, name };
                  if (!f.slug) {
                    const slug = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
                    if (slug) next.slug = slug;
                  }
                  return next;
                });
              }}
              placeholder="למשל: לקוחות"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">מזהה (אנגלית)</label>
            <input
              type="text"
              value={entityForm.slug}
              onChange={(e) =>
                setEntityForm((f) => ({
                  ...f,
                  slug: e.target.value
                    .toLowerCase()
                    .replace(/\s+/g, "-")
                    .replace(/[^a-z0-9-]/g, ""),
                }))
              }
              placeholder="customers"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              required
            />
            <p className="mt-1 text-xs text-slate-500">אותיות קטנות, מספרים ומקף בלבד</p>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={entitySubmitting}
              className="flex-1 rounded-lg bg-primary-600 py-2.5 font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {entitySubmitting ? "יוצר..." : "צור ישות"}
            </button>
            <button
              type="button"
              onClick={closeEntityModal}
              className="rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-600 hover:bg-slate-50"
            >
              ביטול
            </button>
          </div>
        </form>
      </Modal>

      {/* מודל הוספת/עריכת שדה */}
      <Modal
        isOpen={fieldModalOpen}
        onClose={closeFieldModal}
        title={editingField ? "עריכת שדה" : "הוספת שדה"}
      >
        <form onSubmit={submitField} className="space-y-4">
          {fieldError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{fieldError}</div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">מזהה שדה</label>
            <input
              type="text"
              value={fieldForm.name}
              onChange={(e) =>
                setFieldForm((f) => ({
                  ...f,
                  name: e.target.value.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, ""),
                }))
              }
              placeholder="name"
              disabled={!!editingField}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:bg-slate-100"
              required
            />
            {!editingField && (
              <p className="mt-1 text-xs text-slate-500">אנגלית, אותיות ומספרים. לא ניתן לשנות אחרי יצירה.</p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">תווית (עברית)</label>
            <input
              type="text"
              value={fieldForm.label}
              onChange={(e) => setFieldForm((f) => ({ ...f, label: e.target.value }))}
              placeholder="שם מלא"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">סוג שדה</label>
            <select
              value={fieldForm.type}
              onChange={(e) => setFieldForm((f) => ({ ...f, type: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              {FIELD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">קבוצה (אופציונלי)</label>
            <input
              type="text"
              value={fieldForm.section}
              onChange={(e) => setFieldForm((f) => ({ ...f, section: e.target.value }))}
              placeholder="מידע כללי"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={fieldForm.required}
              onChange={(e) => setFieldForm((f) => ({ ...f, required: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-slate-700">שדה חובה</span>
          </label>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={fieldSubmitting}
              className="flex-1 rounded-lg bg-primary-600 py-2.5 font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {fieldSubmitting ? "שומר..." : editingField ? "עדכן" : "הוסף שדה"}
            </button>
            <button
              type="button"
              onClick={closeFieldModal}
              className="rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-600 hover:bg-slate-50"
            >
              ביטול
            </button>
          </div>
        </form>
      </Modal>

      {/* מודל אישור מחיקה */}
      <Modal
        isOpen={!!deleteConfirmField}
        onClose={() => setDeleteConfirmField(null)}
        title="מחיקת שדה"
      >
        {deleteConfirmField && (
          <div className="space-y-4">
            <p className="text-slate-600">
              האם למחוק את השדה &quot;{deleteConfirmField.label}&quot;? פעולה זו לא ניתנת לביטול.
            </p>
            <div className="flex gap-2">
              <button
                onClick={deleteField}
                className="flex-1 rounded-lg bg-red-600 py-2.5 font-medium text-white hover:bg-red-700"
              >
                מחק
              </button>
              <button
                onClick={() => setDeleteConfirmField(null)}
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
