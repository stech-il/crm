"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { FieldDef } from "../lib/dynamicTypes";

function FileUploadField({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileValue = value as { url?: string; filename?: string } | null | undefined;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שגיאה בהעלאה");
      onChange({ url: data.url, filename: data.filename || file.name });
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בהעלאת קובץ");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <input
        type="file"
        onChange={handleFileChange}
        disabled={uploading}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm file:mr-4 file:rounded file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100 disabled:opacity-50"
      />
      {uploading && (
        <p className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          מעלה קובץ...
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {fileValue?.url && (
        <div className="rounded-lg bg-slate-50 p-2">
          <a
            href={fileValue.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary-600 hover:underline"
          >
            {fileValue.filename || "צפה בקובץ"}
          </a>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="mr-2 text-xs text-slate-500 hover:text-red-600"
          >
            הסר
          </button>
        </div>
      )}
    </div>
  );
}

type Props = {
  field: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
  users?: { id: string; name: string }[];
};

export default function DynamicField({ field, value, onChange, users = [] }: Props) {
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    if (field.options) {
      try {
        const parsed = JSON.parse(field.options);
        setOptions(Array.isArray(parsed) ? parsed : []);
      } catch {
        setOptions([]);
      }
    }
  }, [field.options]);

  const inputClass = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500";

  const renderInput = () => {
    switch (field.type) {
      case "text":
      case "email":
      case "phone":
      case "url":
        return (
          <input
            type={field.type === "email" ? "email" : field.type === "url" ? "url" : "text"}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            placeholder={field.placeholder ?? undefined}
            className={inputClass}
          />
        );
      case "number":
      case "currency":
        return (
          <input
            type="number"
            value={(value as number) ?? ""}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            required={field.required}
            placeholder={field.placeholder ?? undefined}
            className={inputClass}
          />
        );
      case "textarea":
        return (
          <textarea
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            placeholder={field.placeholder ?? undefined}
            rows={3}
            className={inputClass}
          />
        );
      case "select":
        return (
          <select
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value || null)}
            required={field.required}
            className={inputClass}
          >
            <option value="">בחר...</option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        );
      case "multiselect":
        const arr = (value as string[]) ?? [];
        return (
          <select
            multiple
            value={arr}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, (o) => o.value);
              onChange(selected);
            }}
            className={inputClass}
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        );
      case "date":
        return (
          <input
            type="date"
            value={(value as string)?.toString().slice(0, 10) ?? ""}
            onChange={(e) => onChange(e.target.value || null)}
            required={field.required}
            className={inputClass}
          />
        );
      case "datetime":
        return (
          <input
            type="datetime-local"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value || null)}
            required={field.required}
            className={inputClass}
          />
        );
      case "checkbox":
        return (
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded"
          />
        );
      case "user":
        return (
          <select
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value || null)}
            required={field.required}
            className={inputClass}
          >
            <option value="">בחר...</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        );
      case "file":
        return (
          <FileUploadField value={value} onChange={onChange} />
        );
      default:
        return (
          <input
            type="text"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            placeholder={field.placeholder ?? undefined}
            className={inputClass}
          />
        );
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-600">
        {field.label} {field.required && <span className="text-red-500">•</span>}
      </label>
      {renderInput()}
    </div>
  );
}
