"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Settings, Search } from "lucide-react";

type SearchResult = { id: string; entitySlug: string; entityName: string; title: string; updatedAt: string };

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const [searchQ, setSearchQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [focused, setFocused] = useState(false);

  const search = useCallback(() => {
    if (searchQ.length < 2) {
      setResults([]);
      return;
    }
    fetch(`/api/search?q=${encodeURIComponent(searchQ)}`)
      .then((r) => r.json())
      .then((res) => setResults(res.results || []));
  }, [searchQ]);

  useEffect(() => {
    const t = setTimeout(search, 200);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!focused && searchQ.length < 2) setShowResults(false);
    else if (results.length > 0) setShowResults(true);
  }, [focused, searchQ, results.length]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 text-white">
            <span className="text-sm font-bold">CRM</span>
          </div>
        </Link>
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="חיפוש גלובלי..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && results[0]) {
                router.push(`/dynamic/${results[0].entitySlug}/${results[0].id}`);
                setSearchQ("");
                setShowResults(false);
              }
            }}
            className="w-full rounded-lg border border-slate-200 py-2 pr-10 pl-3 text-sm"
          />
          {showResults && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-slate-200 bg-white shadow-lg py-2 max-h-64 overflow-y-auto">
              {results.map((r) => (
                <Link
                  key={r.id}
                  href={`/dynamic/${r.entitySlug}/${r.id}`}
                  onClick={() => { setSearchQ(""); setShowResults(false); }}
                  className="block px-4 py-2 hover:bg-slate-50"
                >
                  <span className="font-medium text-primary-600">{r.title}</span>
                  <span className="text-slate-500 text-sm mr-2"> – {r.entityName}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/admin"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          title="הגדרות"
        >
          <Settings className="h-5 w-5" />
        </Link>
        <div className="mr-2 h-8 w-px bg-slate-200" />
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600">
            <User className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-800">{session?.user?.name}</span>
            <span className="text-xs text-slate-500">{session?.user?.email}</span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mr-2 text-sm text-slate-500 hover:text-slate-700"
          >
            התנתק
          </button>
        </div>
      </div>
    </header>
  );
}
