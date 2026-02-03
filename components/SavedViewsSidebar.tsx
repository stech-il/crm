"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

type SavedView = {
  id: string;
  name: string;
  module: string;
};

export default function SavedViewsSidebar({
  module,
  onSelectView,
  selectedViewId,
}: {
  module: string;
  onSelectView?: (view: SavedView) => void;
  selectedViewId?: string;
}) {
  const [views, setViews] = useState<SavedView[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`/api/saved-views?module=${module}`)
      .then((r) => r.json())
      .then(setViews);
  }, [module]);

  const filtered = views.filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-64 shrink-0 border-l border-slate-200 bg-white p-4">
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-slate-600">חפש תצוגות</label>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש..."
            className="w-full rounded-lg border border-slate-300 py-2 pr-10 pl-3 text-sm"
          />
        </div>
      </div>
      <ul className="space-y-1">
        {filtered.map((v) => (
          <li key={v.id}>
            <button
              onClick={() => onSelectView?.(v)}
              className={`w-full rounded px-3 py-2 text-right text-sm ${
                selectedViewId === v.id
                  ? "bg-primary-50 font-medium text-primary-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {v.name}
            </button>
          </li>
        ))}
      </ul>
      {filtered.length === 0 && (
        <p className="py-4 text-center text-sm text-slate-400">אין תצוגות שמורות</p>
      )}
    </div>
  );
}
