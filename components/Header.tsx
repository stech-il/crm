"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Settings, Search, Keyboard, Bell, Sun, Moon, Shield } from "lucide-react";
import { usePolling } from "../lib/usePolling";

type SearchResult = { id: string; entitySlug: string; entityName: string; title: string; updatedAt: string };
type NotificationItem = { id: string; type: string; title: string; body: string | null; link: string | null; readAt: string | null; createdAt: string };

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const [searchQ, setSearchQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [focused, setFocused] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = useCallback(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((res) => setNotifications(res.notifications || []));
  }, []);
  useEffect(() => fetchNotifications(), [fetchNotifications]);
  usePolling(fetchNotifications, [], 60_000);

  const markRead = (id: string) => {
    fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
  };
  const markAllRead = () => {
    fetch("/api/notifications/read-all", { method: "POST" });
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
    setShowNotifications(false);
  };
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const toggleDark = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("crm-theme", isDark ? "dark" : "light");
  };

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
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 pl-6 pr-[calc(1.5rem+14rem)] shadow-sm print:hidden">
      <div className="flex items-center gap-4 flex-1 min-w-0 max-w-xl">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 text-white">
            <span className="text-sm font-bold">CRM</span>
          </div>
        </Link>
        <div className="relative flex-1 min-w-0">
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
            <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-slate-200 bg-white shadow-lg py-2 max-h-64 overflow-y-auto z-50 min-w-0">
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

      <div className="flex items-center gap-2 shrink-0">
        <div className="relative">
          <button
            onClick={() => setShowNotifications((v) => !v)}
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            title="התראות"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute left-0 top-full mt-1 w-80 max-h-96 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg z-50">
              <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                <span className="text-sm font-medium text-slate-700">התראות</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-primary-600 hover:underline">סמן הכל כנקרא</button>
                )}
              </div>
              {notifications.length === 0 ? (
                <p className="p-4 text-sm text-slate-500">אין התראות</p>
              ) : (
                notifications.slice(0, 20).map((n) => (
                  <Link
                    key={n.id}
                    href={n.link || "#"}
                    onClick={() => { markRead(n.id); setShowNotifications(false); }}
                    className={`block border-b border-slate-50 px-3 py-2.5 text-sm hover:bg-slate-50 ${!n.readAt ? "bg-primary-50/50" : ""}`}
                  >
                    <p className="font-medium text-slate-800">{n.title}</p>
                    {n.body && <p className="text-xs text-slate-500 mt-0.5 truncate">{n.body}</p>}
                    <p className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" })}</p>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
        <button
          onClick={toggleDark}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:text-slate-400"
          title="מצב כהה / בהיר"
        >
          <Sun className="h-5 w-5 dark:hidden" />
          <Moon className="h-5 w-5 hidden dark:block" />
        </button>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("showKeyboardShortcuts"))}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:text-slate-400"
          title="קיצורי מקלדת (?)"
        >
          <Keyboard className="h-5 w-5" />
        </button>
        <Link
          href="/settings"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:text-slate-400"
          title="הגדרות חשבון (2FA)"
        >
          <Shield className="h-5 w-5" />
        </Link>
        <Link
          href="/admin"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:text-slate-400"
          title="ניהול מערכת"
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
            onClick={() => signOut({ callbackUrl: typeof window !== "undefined" ? `${window.location.origin}/login` : "/login" })}
            className="mr-2 text-sm text-slate-500 hover:text-slate-700"
          >
            התנתק
          </button>
        </div>
      </div>
    </header>
  );
}
