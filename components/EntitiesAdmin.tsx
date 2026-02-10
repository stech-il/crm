"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Plus, Layers, ChevronDown, Pencil, Trash2, Tag } from "lucide-react";
import { FIELD_TYPES } from "../lib/fieldTypes";
import { ENTITY_ICONS } from "../lib/entityIcons";
import { usePolling } from "../lib/usePolling";
import Modal from "./Modal";

type FieldDef = {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  section: string | null;
  order: number;
  showInList?: boolean;
  showInCard?: boolean;
  options?: string | null;
};

type Entity = {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  fields: FieldDef[];
};

export default function EntitiesAdmin() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [expandedEntity, setExpandedEntity] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [entityModalOpen, setEntityModalOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [fieldModalEntityId, setFieldModalEntityId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<FieldDef | null>(null);
  const [deleteConfirmField, setDeleteConfirmField] = useState<FieldDef | null>(null);
  const [deleteConfirmEntity, setDeleteConfirmEntity] = useState<Entity | null>(null);

  const [entityForm, setEntityForm] = useState({ name: "", slug: "", icon: "Layers" });
  const [entitySubmitting, setEntitySubmitting] = useState(false);
  const [entityError, setEntityError] = useState("");

  const [fieldForm, setFieldForm] = useState({
    name: "",
    label: "",
    type: "text",
    section: "",
    required: false,
    showInList: true,
    showInCard: true,
    optionsText: "",
  });
  const [fieldSubmitting, setFieldSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const fieldNameSeedRef = useRef<string | null>(null);
  const [tags, setTags] = useState<{ id: string; name: string; color: string }[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string })?.role === "admin";

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

  const fetchTags = () => fetch("/api/admin/tags").then((r) => r.json()).then((t) => setTags(Array.isArray(t) ? t : [])).catch(() => setTags([]));
  const addTag = async () => {
    if (!newTagName.trim()) return;
    await fetch("/api/admin/tags", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newTagName.trim() }) });
    setNewTagName("");
    fetchTags();
  };
  useEffect(() => fetchEntities(), []);
  useEffect(() => { if (isAdmin) fetchTags(); }, [isAdmin]);
  usePolling(fetchEntities);

  const openEntityModal = (entity?: Entity) => {
    if (entity) {
      setEditingEntity(entity);
      setEntityForm({
        name: entity.name,
        slug: entity.slug,
        icon: entity.icon || "Layers",
      });
    } else {
      setEditingEntity(null);
      setEntityForm({ name: "", slug: "", icon: "Layers" });
    }
    setEntityError("");
    setEntityModalOpen(true);
  };

  const generateFieldName = (label: string, existingNames: string[]): string => {
    const base = label
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_\u0590-\u05FF]/g, "")
      .replace(/[\u0590-\u05FF]+/g, "")
      .toLowerCase();
    let name = base ? base.replace(/_+/g, "_").replace(/^_|_$/g, "") : "";
    if (!name || !/^[a-z]/.test(name)) {
      if (!fieldNameSeedRef.current) {
        fieldNameSeedRef.current = "field_" + Date.now().toString(36).slice(2, 10);
      }
      name = fieldNameSeedRef.current;
    } else {
      fieldNameSeedRef.current = null;
    }
    let finalName = name;
    let i = 1;
    while (existingNames.includes(finalName)) {
      finalName = `${name}_${i}`;
      i++;
    }
    return finalName;
  };

  const openFieldModal = (entityId: string, field?: FieldDef) => {
    setFieldModalEntityId(entityId);
    setEditingField(field ?? null);
    fieldNameSeedRef.current = null;
    const entity = entities.find((e) => e.id === entityId);
    const existingNames = entity?.fields?.map((f) => f.name) ?? [];
    const initialName = field ? field.name : generateFieldName("", existingNames);
    const parseOptionsToText = (opts: string | null | undefined): string => {
      if (!opts) return "";
      try {
        const arr = JSON.parse(opts);
        if (!Array.isArray(arr)) return "";
        return arr.map((o: { value?: string; label?: string }) => o.label ?? o.value ?? "").join("\n");
      } catch {
        return "";
      }
    };
    setFieldForm(
      field
        ? {
            name: field.name,
            label: field.label,
            type: field.type,
            section: field.section || "",
            required: field.required,
            showInList: field.showInList !== false,
            showInCard: field.showInCard !== false,
            optionsText: parseOptionsToText(field.options),
          }
        : {
            name: initialName,
            label: "",
            type: "text",
            section: "",
            required: false,
            showInList: true,
            showInCard: true,
            optionsText: "",
          }
    );
    setFieldError("");
    setFieldModalOpen(true);
  };

  const closeEntityModal = () => {
    setEntityModalOpen(false);
    setEditingEntity(null);
    setEntityError("");
  };

  const closeFieldModal = () => {
    setFieldModalOpen(false);
    setFieldModalEntityId(null);
    setEditingField(null);
    setFieldError("");
    fieldNameSeedRef.current = null;
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
      const body = {
        name: entityForm.name.trim(),
        slug,
        icon: entityForm.icon || null,
      };
      if (editingEntity) {
        const res = await fetch(`/api/admin/entities/${editingEntity.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("שגיאה בעדכון");
      } else {
        const res = await fetch("/api/admin/entities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("שגיאה ביצירת כרטסת");
      }
      closeEntityModal();
      fetchEntities();
    } catch (err) {
      setEntityError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setEntitySubmitting(false);
    }
  };

  const deleteEntity = async () => {
    if (!deleteConfirmEntity) return;
    await fetch(`/api/admin/entities/${deleteConfirmEntity.id}`, { method: "DELETE" });
    setDeleteConfirmEntity(null);
    setExpandedEntity(null);
    closeEntityModal();
    fetchEntities();
  };

  const submitField = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError("");
    if (!fieldModalEntityId) return;
    if (!fieldForm.label.trim()) {
      setFieldError("נא למלא תווית");
      return;
    }
    const needsOptions = fieldForm.type === "select" || fieldForm.type === "multiselect";
    const optionsArr = fieldForm.optionsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (needsOptions && optionsArr.length === 0) {
      setFieldError("בשדה בחירה מרשימה/מרובה יש להזין לפחות אפשרות אחת");
      return;
    }
    const entity = entities.find((e) => e.id === fieldModalEntityId);
    const existingNames = entity?.fields?.map((f) => f.name) ?? [];
    const name = editingField
      ? fieldForm.name.trim().replace(/\s+/g, "_")
      : generateFieldName(fieldForm.label, existingNames);
    if (!name || !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) {
      setFieldError("לא ניתן ליצור מזהה אוטומטי. נסה תווית עם אותיות באנגלית.");
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
            showInList: fieldForm.showInList,
            showInCard: fieldForm.showInCard,
            options: needsOptions ? JSON.stringify(optionsArr.map((t) => ({ value: t, label: t }))) : null,
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
            showInList: fieldForm.showInList,
            showInCard: fieldForm.showInCard,
            options: needsOptions ? JSON.stringify(optionsArr.map((t) => ({ value: t, label: t }))) : null,
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
        <div className="animate-pulse h-64 rounded bg-slate-200 dark:bg-slate-700" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          <Layers className="inline h-8 w-8 ml-2" />
          כרטסאות
        </h1>
        <button
          onClick={() => openEntityModal()}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          הוסף כרטסת
        </button>
      </div>

      <p className="mb-6 text-slate-600 dark:text-slate-400">
        הגדרת כרטסאות ושדות. כל שדה ניתן להגדרה דינמית – טקסט, מספר, תאריך, בחירה מרשימה ועוד.
      </p>

      {isAdmin && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800 p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Tag className="h-5 w-5" />
            תגיות
          </h2>
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">תגיות לסיווג רשומות. ניתן להוסיף תגיות לרשומות בהצגת הכרטיס.</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((t) => (
              <span key={t.id} className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm" style={{ backgroundColor: t.color + "20", color: t.color }}>
                {t.name}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="שם תגית חדשה"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTag()}
              className="rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-sm w-40"
            />
            <button
              onClick={addTag}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              הוסף תגית
            </button>
          </div>
        </div>
      )}

      {entities.length === 0 && (
        <div className="mb-6 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 p-12 text-center">
          <p className="mb-6 text-slate-600 dark:text-slate-400">אין עדיין כרטסאות. התחל ביצירת כרטסת ראשונה.</p>
          <button
            onClick={() => openEntityModal()}
            className="rounded-lg bg-primary-600 px-6 py-3 font-medium text-white shadow-sm hover:bg-primary-700"
          >
            + הוסף כרטסת ראשונה
          </button>
        </div>
      )}

      <div className="space-y-4">
        {entities.map((entity) => (
          <div
            key={entity.id}
            className="rounded-xl border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800 shadow-sm overflow-hidden"
          >
            <button
              onClick={() => setExpandedEntity(expandedEntity === entity.id ? null : entity.id)}
              className="flex w-full items-center justify-between p-4 text-right hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                {(() => {
                  const IconComp = ENTITY_ICONS.find((i) => i.value === (entity.icon || "Layers"))?.Icon ?? ENTITY_ICONS[ENTITY_ICONS.length - 1].Icon;
                  return <IconComp className="h-5 w-5 shrink-0 text-slate-500" />;
                })()}
                <span className="font-semibold text-slate-800 dark:text-slate-100">{entity.name}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">/{entity.slug}</span>
                <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 text-xs text-slate-600 dark:text-slate-300">
                  {entity.fields.length} שדות
                </span>
                <Link
                  href={`/dynamic/${entity.slug}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline"
                >
                  צפה ברשומות
                </Link>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => openEntityModal(entity)}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-600"
                    title="ערוך כרטסת"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmEntity(entity)}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                    title="מחק כרטסת"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${expandedEntity === entity.id ? "rotate-180" : ""}`}
              />
            </button>

            {expandedEntity === entity.id && (
              <div className="border-t border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-700/30 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-medium text-slate-700 dark:text-slate-200">שדות</h3>
                  <button
                    onClick={() => openFieldModal(entity.id)}
                    className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
                  >
                    <Plus className="h-4 w-4" />
                    הוסף שדה
                  </button>
                </div>
                {entity.fields.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 py-10 text-center">
                    <p className="mb-4 text-slate-500 dark:text-slate-400">אין שדות. הוסף שדה כדי ליצור רשומות.</p>
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
                        className="flex items-center justify-between rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 p-3 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-slate-800 dark:text-slate-100">{field.label}</span>
                          <span className="text-sm text-slate-500 dark:text-slate-400 font-mono">{field.name}</span>
                          <span className="rounded bg-slate-200 dark:bg-slate-600 px-2 py-0.5 text-xs text-slate-600 dark:text-slate-300">
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
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700"
                            title="ערוך"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmField(field)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
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

      <Modal isOpen={entityModalOpen} onClose={closeEntityModal} title={editingEntity ? "עריכת כרטסת" : "הוספת כרטסת"}>
        <form onSubmit={submitEntity} className="space-y-4">
          {entityError && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300">{entityError}</div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">אייקון</label>
            <div className="flex flex-wrap gap-2">
              {ENTITY_ICONS.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setEntityForm((f) => ({ ...f, icon: value }))}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    entityForm.icon === value
                      ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">שם (עברית)</label>
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
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-3 py-2.5 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">מזהה (אנגלית)</label>
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
              disabled={!!editingEntity}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-3 py-2.5 font-mono text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:bg-slate-100 disabled:text-slate-500 dark:disabled:bg-slate-700"
              required
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {editingEntity ? "מזהה לא ניתן לשינוי" : "אותיות קטנות, מספרים ומקף בלבד"}
            </p>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={entitySubmitting}
              className="flex-1 rounded-lg bg-primary-600 py-2.5 font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {entitySubmitting ? "שומר..." : editingEntity ? "עדכן" : "צור כרטסת"}
            </button>
            <button
              type="button"
              onClick={closeEntityModal}
              className="rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              ביטול
            </button>
            {editingEntity && (
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmEntity(editingEntity);
                  closeEntityModal();
                }}
                className="rounded-lg border border-red-300 dark:border-red-700 px-4 py-2.5 font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                מחק כרטסת
              </button>
            )}
          </div>
        </form>
      </Modal>

      <Modal isOpen={fieldModalOpen} onClose={closeFieldModal} title={editingField ? "עריכת שדה" : "הוספת שדה"}>
        <form onSubmit={submitField} className="space-y-4">
          {fieldError && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300">{fieldError}</div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">תווית (מה יוצג למשתמש)</label>
            <input
              type="text"
              value={fieldForm.label}
              onChange={(e) => {
                const label = e.target.value;
                setFieldForm((f) => {
                  const next = { ...f, label };
                  if (!editingField && fieldModalEntityId) {
                    const entity = entities.find((e) => e.id === fieldModalEntityId);
                    const existingNames = entity?.fields?.map((f) => f.name) ?? [];
                    next.name = generateFieldName(label, existingNames);
                  }
                  return next;
                });
              }}
              placeholder="שם מלא, טלפון, אימייל..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-3 py-2.5 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              required
            />
            {!editingField && fieldForm.name && (
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                מזהה: <span className="font-mono font-medium text-slate-600 dark:text-slate-300">{fieldForm.name}</span>
              </p>
            )}
          </div>
          {editingField && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">מזהה (טכני)</label>
              <span className="block rounded-lg bg-slate-100 dark:bg-slate-700 px-3 py-2.5 font-mono text-sm text-slate-600 dark:text-slate-300">
                {fieldForm.name}
              </span>
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">סוג שדה</label>
            <select
              value={fieldForm.type}
              onChange={(e) => setFieldForm((f) => ({ ...f, type: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-3 py-2.5 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              {FIELD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">קבוצה (אופציונלי)</label>
            <input
              type="text"
              value={fieldForm.section}
              onChange={(e) => setFieldForm((f) => ({ ...f, section: e.target.value }))}
              placeholder="מידע כללי"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-3 py-2.5 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          {(fieldForm.type === "select" || fieldForm.type === "multiselect") && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                רשימת אפשרויות (אפשרות אחת בכל שורה)
              </label>
              <textarea
                value={fieldForm.optionsText}
                onChange={(e) => setFieldForm((f) => ({ ...f, optionsText: e.target.value }))}
                placeholder={"ממתין\nפעיל\nהושלם"}
                rows={5}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-3 py-2.5 font-mono text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">כתוב אפשרות אחת בכל שורה. לדוגמה: ממתין, פעיל, הושלם</p>
            </div>
          )}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={fieldForm.required}
                onChange={(e) => setFieldForm((f) => ({ ...f, required: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">שדה חובה</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={fieldForm.showInList}
                onChange={(e) => setFieldForm((f) => ({ ...f, showInList: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">מופיע בראשי הטבלה (רשימה)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={fieldForm.showInCard}
                onChange={(e) => setFieldForm((f) => ({ ...f, showInCard: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">מופיע בכרטסת (לחיצה על שורה)</span>
            </label>
          </div>
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
              className="rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              ביטול
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteConfirmField} onClose={() => setDeleteConfirmField(null)} title="מחיקת שדה">
        {deleteConfirmField && (
          <div className="space-y-4">
            <p className="text-slate-600 dark:text-slate-400">
              האם למחוק את השדה &quot;{deleteConfirmField.label}&quot;? פעולה זו לא ניתנת לביטול.
            </p>
            <div className="flex gap-2">
              <button onClick={deleteField} className="flex-1 rounded-lg bg-red-600 py-2.5 font-medium text-white hover:bg-red-700">
                מחק
              </button>
              <button
                onClick={() => setDeleteConfirmField(null)}
                className="rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                ביטול
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!deleteConfirmEntity} onClose={() => setDeleteConfirmEntity(null)} title="מחיקת כרטסת">
        {deleteConfirmEntity && (
          <div className="space-y-4">
            <p className="text-slate-600 dark:text-slate-400">
              האם למחוק את הכרטסת &quot;{deleteConfirmEntity.name}&quot;? כל השדות והרשומות יימחקו. פעולה זו לא ניתנת לביטול.
            </p>
            <div className="flex gap-2">
              <button onClick={deleteEntity} className="flex-1 rounded-lg bg-red-600 py-2.5 font-medium text-white hover:bg-red-700">
                מחק
              </button>
              <button
                onClick={() => setDeleteConfirmEntity(null)}
                className="rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
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
