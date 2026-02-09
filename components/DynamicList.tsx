"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, Download, Upload, Filter, ChevronDown, ChevronUp, Bookmark, LayoutGrid, List, Archive, FileText, Trash2 } from "lucide-react";
import { formatFieldValue, isFileValue } from "../lib/formatFieldValue";
import { usePolling } from "../lib/usePolling";

type FieldDef = { id: string; name: string; label: string; type: string; showInList?: boolean; options?: string | null };
type Entity = { id: string; name: string; slug: string; fields: FieldDef[] };
type DynamicRecordItem = { id: string; data: Record<string, unknown>; updatedAt: string; createdAt?: string };
type SavedView = { id: string; name: string; filter: string | null; sort: string | null; module: string };

type Props = {
  entitySlug: string;
};

export default function DynamicList({ entitySlug }: Props) {
  const [entity, setEntity] = useState<Entity | null>(null);
  const [records, setRecords] = useState<DynamicRecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterField, setFilterField] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [sortField, setSortField] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [allTags, setAllTags] = useState<{ id: string; name: string; color: string }[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const [saveViewName, setSaveViewName] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "pipeline">("table");
  const [pipelineField, setPipelineField] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [templates, setTemplates] = useState<{ id: string; name: string }[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; total: number; errors: number } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const buildParams = useCallback(() => {
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    if (filterField && filterValue) {
      p.set("filter", JSON.stringify([{ field: filterField, op: "contains", value: filterValue }]));
    }
    if (sortField) p.set("sort", JSON.stringify({ field: sortField, dir: sortDir }));
    if (showArchived) p.set("archived", "1");
    if (filterTags.length > 0) p.set("tags", filterTags.join(","));
    p.set("page", String(page));
    p.set("limit", "25");
    return p.toString();
  }, [search, filterField, filterValue, sortField, sortDir, showArchived, filterTags, page]);

  const fetchData = useCallback(() => {
    const qs = buildParams();
    fetch(`/api/dynamic/${entitySlug}${qs ? `?${qs}` : ""}`)
      .then((r) => r.json())
      .then((res) => {
        setEntity(res.entity || null);
        setRecords(res.records || []);
        setTotalCount(res.totalCount ?? res.records?.length ?? 0);
        setTotalPages(res.totalPages ?? 1);
        setLoading(false);
      });
  }, [entitySlug, buildParams]);

  useEffect(() => fetchData(), [fetchData]);
  usePolling(fetchData, [entitySlug, buildParams]);
  useEffect(() => setPage(1), [search, filterField, filterValue, showArchived, filterTags]);

  const fetchViews = useCallback(() => {
    fetch(`/api/saved-views?module=${entitySlug}`)
      .then((r) => r.json())
      .then(setSavedViews)
      .catch(() => setSavedViews([]));
  }, [entitySlug]);

  useEffect(() => fetchViews(), [fetchViews]);
  useEffect(() => {
    fetch("/api/tags").then((r) => r.json()).then((t) => setAllTags(Array.isArray(t) ? t : [])).catch(() => setAllTags([]));
  }, []);

  const fetchTemplates = useCallback(() => {
    fetch(`/api/dynamic/${entitySlug}/templates`)
      .then((r) => r.json())
      .then((t) => setTemplates(Array.isArray(t) ? t.map((x: { id: string; name: string }) => ({ id: x.id, name: x.name })) : []))
      .catch(() => setTemplates([]));
  }, [entitySlug]);
  useEffect(() => fetchTemplates(), [fetchTemplates]);

  const deleteTemplate = async (templateId: string) => {
    if (!confirm("למחוק תבנית זו?")) return;
    await fetch(`/api/dynamic/${entitySlug}/templates/${templateId}`, { method: "DELETE" });
    setTemplates((prev) => prev.filter((t) => t.id !== templateId));
  };

  const applyView = (v: SavedView) => {
    if (v.filter) {
      try {
        const filters = JSON.parse(v.filter) as { field: string; value: string }[];
        if (filters[0]) {
          setFilterField(filters[0].field);
          setFilterValue(filters[0].value || "");
        }
      } catch {}
    }
    if (v.sort) {
      try {
        const s = JSON.parse(v.sort) as { field: string; dir: "asc" | "desc" };
        setSortField(s.field || "");
        setSortDir(s.dir || "desc");
      } catch {}
    }
  };

  const saveView = async () => {
    if (!saveViewName.trim()) return;
    await fetch("/api/saved-views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: saveViewName.trim(),
        module: entitySlug,
        filter: filterField && filterValue ? JSON.stringify([{ field: filterField, op: "contains", value: filterValue }]) : null,
        sort: sortField ? JSON.stringify({ field: sortField, dir: sortDir }) : null,
      }),
    });
    setSaveViewName("");
    fetchViews();
  };

  const exportCsv = () => {
    const qs = buildParams();
    window.open(`/api/dynamic/${entitySlug}?${qs}&format=csv`, "_blank");
  };

  const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(`/api/dynamic/${entitySlug}/import`, { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        setImportResult(data);
        fetchData();
      } else alert(data.error || "שגיאה בייבוא");
    } catch {
      alert("שגיאה בייבוא");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const moveRecordToColumn = async (recordId: string, newValue: string) => {
    await fetch(`/api/dynamic/${entitySlug}/${recordId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: { ...((records.find((r) => r.id === recordId)?.data as Record<string, unknown>) || {}), [pipelineField]: newValue } }),
    });
    fetchData();
  };

  const handlePipelineDrop = (e: React.DragEvent, colValue: string) => {
    e.preventDefault();
    const recordId = e.dataTransfer.getData("recordId");
    if (recordId) moveRecordToColumn(recordId, colValue);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === records.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(records.map((r) => r.id)));
  };

  const quickStatusChange = async (recordId: string, fieldName: string, newValue: string) => {
    const rec = records.find((r) => r.id === recordId);
    if (!rec) return;
    const nextData = { ...(rec.data as Record<string, unknown>), [fieldName]: newValue };
    await fetch(`/api/dynamic/${entitySlug}/${recordId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: nextData }),
    });
    fetchData();
  };

  const getSelectOptions = (field: FieldDef): { value: string; label: string }[] => {
    if (!field.options) return [];
    try {
      const opts = JSON.parse(field.options) as { value?: string; label?: string }[];
      return (opts ?? []).map((o) => ({ value: String(o?.value ?? o?.label ?? ""), label: String(o?.label ?? o?.value ?? "") })).filter((o) => o.value !== "");
    } catch {
      return [];
    }
  };

  const bulkArchive = async () => {
    if (selectedIds.size === 0) return;
    await fetch(`/api/dynamic/${entitySlug}/bulk-archive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selectedIds) }),
    });
    setSelectedIds(new Set());
    fetchData();
  };

  if (!entity) {
    if (loading) return <div className="p-8 animate-pulse h-64 bg-slate-200 rounded" />;
    return (
      <div className="p-8">
        <p className="text-slate-500">כרטסת לא נמצאה.</p>
        <Link href="/admin" className="mt-4 inline-block text-primary-600 hover:underline">
          ← חזרה לניהול
        </Link>
      </div>
    );
  }

  if (!entity.fields || entity.fields.length === 0) {
    return (
      <div className="p-8">
        <h1 className="mb-4 text-2xl font-bold text-slate-800">{entity.name}</h1>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <p className="text-amber-800">
            אין שדות מוגדרים לכרטסת זו. הוסף שדות בלוח הניהול כדי ליצור רשומות.
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

  const displayFields = (entity.fields || []).filter((f) => f.showInList !== false);
  const pipelineFields = (entity.fields || []).filter((f) => f.type === "select" || f.type === "multiselect");

  const getPipelineColumns = () => {
    if (!pipelineField) return [""];
    const field = entity.fields.find((f) => f.name === pipelineField);
    const optionValues: string[] = [];
    if (field?.options) {
      try {
        const opts = JSON.parse(field.options) as { value?: string; label?: string }[];
        optionValues.push(...(opts?.map((o) => o?.value ?? o?.label ?? "")).filter(Boolean) ?? []);
      } catch {}
    }
    const fromRecords = new Set<string>();
    records.forEach((r) => {
      const v = (r.data as Record<string, unknown>)[pipelineField];
      if (v != null && v !== "") fromRecords.add(String(v));
    });
    optionValues.forEach((v) => fromRecords.add(v));
    return ["", ...Array.from(fromRecords).sort()];
  };

  const pipelineColumns = viewMode === "pipeline" ? getPipelineColumns() : [];
  const recordsByColumn = viewMode === "pipeline" && pipelineField
    ? pipelineColumns.reduce((acc, col) => {
        acc[col] = records.filter((r) => {
          const v = (r.data as Record<string, unknown>)[pipelineField];
          return String(v ?? "") === col;
        });
        return acc;
      }, {} as Record<string, DynamicRecordItem[]>)
    : {};

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">
          {entity.name} ({totalCount})
        </h1>
        <div className="flex items-center gap-2">
          {templates.length > 0 && (
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${showTemplates ? "bg-primary-100 text-primary-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              <FileText className="h-4 w-4" />
              תבניות ({templates.length})
            </button>
          )}
          <Link
            href={`/dynamic/${entitySlug}/new`}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            חדש
          </Link>
        </div>
      </div>

      {importResult && (
        <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-800 text-sm">
          ייבוא הושלם: {importResult.imported} מתוך {importResult.total} רשומות
          {importResult.errors > 0 && ` (${importResult.errors} שגיאות)`}
          <button onClick={() => setImportResult(null)} className="mr-2 text-emerald-600 hover:underline">סגור</button>
        </div>
      )}

      {showTemplates && templates.length > 0 && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">ניהול תבניות</h3>
          <div className="flex flex-wrap gap-2">
            {templates.map((t) => (
              <div key={t.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                <span className="text-sm text-slate-700">{t.name}</span>
                <Link href={`/dynamic/${entitySlug}/new?template=${t.id}`} className="text-xs text-primary-600 hover:underline">השתמש</Link>
                <button
                  onClick={() => deleteTemplate(t.id)}
                  className="text-red-500 hover:text-red-700"
                  title="מחק תבנית"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="חיפוש..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 py-2 pr-10 pl-3 text-sm"
          />
        </div>
        <button
          onClick={() => setShowArchived(!showArchived)}
          className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm ${showArchived ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          title={showArchived ? "הצג רק ארכיון" : "הצג ארכיון"}
        >
          <Archive className="h-4 w-4" />
          {showArchived ? "ארכיון" : "פעיל"}
        </button>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm ${showFilter ? "bg-primary-100 text-primary-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
        >
          <Filter className="h-4 w-4" />
          סינון
        </button>
        {savedViews.length > 0 && (
          <select
            onChange={(e) => {
              const id = e.target.value;
              const v = savedViews.find((x) => x.id === id);
              if (v) applyView(v);
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">תצוגה שמורה...</option>
            {savedViews.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        )}
        <div className="flex items-center gap-1">
          <input
            type="text"
            placeholder="שם תצוגה"
            value={saveViewName}
            onChange={(e) => setSaveViewName(e.target.value)}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm w-28"
          />
          <button onClick={saveView} className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600 hover:bg-slate-200" title="שמור תצוגה">
            <Bookmark className="h-4 w-4" />
          </button>
        </div>
        {!showArchived && selectedIds.size > 0 && (
          <button onClick={bulkArchive} className="flex items-center gap-1 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700">
            <Archive className="h-4 w-4" />
            ארכב ({selectedIds.size})
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleImportCsv}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="flex items-center gap-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          {importing ? "מייבא..." : "ייבוא CSV"}
        </button>
        <button onClick={exportCsv} className="flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
          <Download className="h-4 w-4" />
          ייצוא CSV
        </button>
        {pipelineFields.length > 0 && (
          <>
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-2 text-sm ${viewMode === "table" ? "bg-primary-100 text-primary-700" : "bg-slate-100 text-slate-600"}`}
                title="טבלה"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setViewMode("pipeline");
                  if (!pipelineField && pipelineFields[0]) setPipelineField(pipelineFields[0].name);
                }}
                className={`px-3 py-2 text-sm ${viewMode === "pipeline" ? "bg-primary-100 text-primary-700" : "bg-slate-100 text-slate-600"}`}
                title="פאנלים"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
            {viewMode === "pipeline" && (
              <select
                value={pipelineField}
                onChange={(e) => setPipelineField(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">בחר שדה למיון...</option>
                {pipelineFields.map((f) => (
                  <option key={f.id} value={f.name}>{f.label}</option>
                ))}
              </select>
            )}
          </>
        )}
      </div>
      {showFilter && (
        <div className="mb-4 flex flex-wrap gap-2 items-center rounded-lg border border-slate-200 bg-slate-50 p-3">
          <select
            value={filterField}
            onChange={(e) => setFilterField(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">בחר שדה...</option>
            {displayFields.map((f) => (
              <option key={f.id} value={f.name}>{f.label}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="ערך..."
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1.5 text-sm w-40"
          />
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mr-2">
              <span className="text-xs text-slate-500 py-1">תגיות:</span>
              {allTags.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setFilterTags((prev) => prev.includes(t.id) ? prev.filter((x) => x !== t.id) : [...prev, t.id])}
                  className={`text-xs px-2 py-1 rounded-full ${filterTags.includes(t.id) ? "ring-2 ring-offset-1" : ""}`}
                  style={{ backgroundColor: filterTags.includes(t.id) ? t.color : t.color + "30", color: filterTags.includes(t.id) ? "white" : t.color }}
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {viewMode === "table" && !showArchived && (
        <div className="mb-4 flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={records.length > 0 && selectedIds.size === records.length}
              onChange={toggleSelectAll}
              className="rounded border-slate-300"
            />
            בחר הכל
          </label>
        </div>
      )}

      {viewMode === "pipeline" && pipelineField ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {pipelineColumns.map((col) => (
            <div
              key={col || "_empty"}
              className="flex-shrink-0 w-72 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handlePipelineDrop(e, col)}
            >
              <div className="px-4 py-3 bg-slate-200 font-semibold text-slate-700">
                {col || "(ללא ערך)"}
              </div>
              <div className="p-2 space-y-2 max-h-[60vh] overflow-y-auto">
                {recordsByColumn[col]?.map((r) => (
                  <div
                    key={r.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("recordId", r.id)}
                    className="block rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:border-primary-300 hover:shadow cursor-grab active:cursor-grabbing"
                  >
                  <Link
                    href={`/dynamic/${entitySlug}/${r.id}`}
                    className="block"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="font-medium text-primary-600 truncate">
                      {displayFields[0]
                        ? (formatFieldValue((r.data as Record<string, unknown>)[displayFields[0].name], displayFields[0].type) || r.id.slice(0, 8))
                        : r.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(r.updatedAt).toLocaleDateString("he-IL")}
                    </p>
                  </Link>
                  <div className="mt-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={String((r.data as Record<string, unknown>)[pipelineField] ?? "")}
                      onChange={(e) => quickStatusChange(r.id, pipelineField, e.target.value)}
                      className="flex-1 rounded border border-slate-200 px-2 py-1 text-xs"
                    >
                      {getPipelineColumns().map((col) => (
                        <option key={col} value={col}>{col || "(ללא ערך)"}</option>
                      ))}
                    </select>
                    <span className="text-xs text-slate-400 shrink-0">גרור</span>
                  </div>
                  </div>
                )) ?? []}
              </div>
            </div>
          ))}
        </div>
      ) : (
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {records.length > 0 ? (
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              {!showArchived && (
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={records.length > 0 && selectedIds.size === records.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300"
                  />
                </th>
              )}
              {displayFields.map((f) => (
                <th key={f.id} className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                  <button
                    onClick={() => toggleSort(f.name)}
                    className="flex items-center gap-1 w-full justify-end hover:text-primary-600"
                  >
                    {f.label}
                    {sortField === f.name && (sortDir === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                  </button>
                </th>
              ))}
              <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                <button
                  onClick={() => toggleSort("createdAt")}
                  className="flex items-center gap-1 w-full justify-end hover:text-primary-600"
                >
                  נוצר
                  {sortField === "createdAt" && (sortDir === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                </button>
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                <button
                  onClick={() => toggleSort("updatedAt")}
                  className="flex items-center gap-1 w-full justify-end hover:text-primary-600"
                >
                  עודכן
                  {sortField === "updatedAt" && (sortDir === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {records.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                {!showArchived && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(r.id)}
                      onChange={() => toggleSelect(r.id)}
                      className="rounded border-slate-300"
                    />
                  </td>
                )}
                {displayFields.map((f) => (
                  <td key={f.id} className="px-6 py-4">
                    {f.type === "select" && getSelectOptions(f).length > 0 ? (
                      <select
                        value={String((r.data as Record<string, unknown>)[f.name] ?? "")}
                        onChange={(e) => quickStatusChange(r.id, f.name, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border border-slate-300 px-2 py-1 text-sm w-full max-w-[200px] hover:border-primary-400"
                      >
                        <option value="">—</option>
                        {getSelectOptions(f).map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    ) : (
                      <Link
                        href={`/dynamic/${entitySlug}/${r.id}`}
                        className="font-medium text-primary-600 hover:underline block"
                      >
                        {(() => {
                          const val = (r.data as Record<string, unknown>)[f.name];
                          if (isFileValue(val)) return val.filename || "קובץ";
                          return formatFieldValue(val, f.type);
                        })()}
                      </Link>
                    )}
                  </td>
                ))}
                <td className="px-6 py-4 text-sm text-slate-600">
                  {r.createdAt ? new Date(r.createdAt).toLocaleString("he-IL") : "—"}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {new Date(r.updatedAt).toLocaleString("he-IL")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        ) : (
          <div className="py-16 px-8 text-center">
            <div className="max-w-sm mx-auto">
              <p className="text-slate-600 font-medium mb-2">אין רשומות</p>
              <p className="text-sm text-slate-500 mb-6">צור רשומה ראשונה, ייבא מקובץ CSV או השתמש בתבנית</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href={`/dynamic/${entitySlug}/new`}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                >
                  <Plus className="h-4 w-4" />
                  רשומה חדשה
                </Link>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  <Upload className="h-4 w-4" />
                  ייבוא CSV
                </button>
                {templates.length > 0 && (
                  <Link
                    href={`/dynamic/${entitySlug}/new?template=${templates[0].id}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <FileText className="h-4 w-4" />
                    מתבנית
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {viewMode === "table" && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-slate-300 px-3 py-1 text-sm disabled:opacity-50"
          >
            ←
          </button>
          <span className="text-sm text-slate-600">
            עמוד {page} מתוך {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-slate-300 px-3 py-1 text-sm disabled:opacity-50"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
