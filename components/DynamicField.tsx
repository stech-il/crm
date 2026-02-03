"use client";

import { useEffect, useState } from "react";

type FieldDef = {
  id: string;
  name: string;
  label: string;
  type: string;
  options: string | null;
  required: boolean;
  placeholder: string | null;
  section: string | null;
};

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
          <input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onChange({ name: file.name, size: file.size });
            }}
            className={inputClass}
          />
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
