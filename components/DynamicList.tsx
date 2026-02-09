"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, Download, Filter, ChevronDown, ChevronUp, Bookmark, LayoutGrid, List, Archive } from "lucide-react";
import { formatFieldValue, isFileValue } from "../lib/formatFieldValue";
import { usePolling } from "../lib/usePolling";

type FieldDef = { id: string; name: string; label: string; type: string; showInList?: boolean; options?: string | null };
type Entity = { id: string; name: string; slug: string; fields: FieldDef[] };
type DynamicRecordItem = { id: string; data: Record<string, unknown>; updatedAt: string };
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
  const [showFilter, setShowFilter] = useState(false);
  const [saveViewName, setSaveViewName] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "pipeline">("table");
  const [pipelineField, setPipelineField] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const buildParams = useCallback(() => {
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    if (filterField && filterValue) {
      p.set("filter", JSON.stringify([{ field: filterField, op: "contains", value: filterValue }]));
    }
    if (sortField) p.set("sort", JSON.stringify({ field: sortField, dir: sortDir }));
    if (showArchived) p.set("archived", "1");
    return p.toString();
  }, [search, filterField, filterValue, sortField, sortDir, showArchived]);

  const fetchData = useCallback(() => {
    const qs = buildParams();
    fetch(`/api/dynamic/${entitySlug}${qs ? `?${qs}` : ""}`)
      .then((r) => r.json())
      .then((res) => {
        setEntity(res.entity || null);
        setRecords(res.records || []);
        setLoading(false);
      });
  }, [entitySlug, buildParams]);

  useEffect(() => fetchData(), [fetchData]);
  usePolling(fetchData, [entitySlug, buildParams]);

  const fetchViews = useCallback(() => {
    fetch(`/api/saved-views?module=${entitySlug}`)
      .then((r) => r.json())
      .then(setSavedViews)
      .catch(() => setSavedViews([]));
  }, [entitySlug]);

  useEffect(() => fetchViews(), [fetchViews]);

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

  if (!entity) {
    if (loading) return <div className="p-8 animate-pulse h-64 bg-slate-200 rounded" />;
    return (
      <div className="p-8">
        <p className="text-slate-500">ישות לא נמצאה.</p>
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
            אין שדות מוגדרים לישות זו. הוסף שדות בלוח הניהול כדי ליצור רשומות.
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
          {entity.name} ({records.length})
        </h1>
        <Link
          href={`/dynamic/${entitySlug}/new`}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          חדש
        </Link>
      </div>

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
        <div className="mb-4 flex gap-2 items-center rounded-lg border border-slate-200 bg-slate-50 p-3">
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
                  <p className="text-xs text-slate-400 mt-1">גרור לשינוי סטטוס</p>
                  </div>
                )) ?? []}
              </div>
            </div>
          ))}
        </div>
      ) : (
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
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
                {displayFields.map((f) => (
                  <td key={f.id} className="px-6 py-4">
                    <Link
                      href={`/dynamic/${entitySlug}/${r.id}`}
                      className="font-medium text-primary-600 hover:underline"
                    >
                      {(() => {
                        const val = (r.data as Record<string, unknown>)[f.name];
                        if (isFileValue(val)) return val.filename || "קובץ";
                        return formatFieldValue(val, f.type);
                      })()}
                    </Link>
                  </td>
                ))}
                <td className="px-6 py-4 text-sm text-slate-600">
                  {new Date(r.updatedAt).toLocaleString("he-IL")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {records.length === 0 && (
          <div className="py-16 text-center text-slate-500">אין רשומות</div>
        )}
      </div>
      )}
    </div>
  );
}
