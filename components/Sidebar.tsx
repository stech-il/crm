"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LayoutDashboard, Settings, Users, Database, Clock, Layers, BarChart3, Plug } from "lucide-react";
import { getEntityIcon } from "../lib/entityIcons";
import { usePolling } from "../lib/usePolling";
import { getRecentlyViewed, type RecentItem } from "../lib/recentlyViewed";
import clsx from "clsx";

type Entity = { id: string; name: string; slug: string; icon?: string | null; order: number };

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string })?.role === "admin";
  const [entities, setEntities] = useState<Entity[]>([]);
  const [recent, setRecent] = useState<RecentItem[]>([]);

  useEffect(() => {
    setRecent(getRecentlyViewed());
    const handler = () => setRecent(getRecentlyViewed());
    window.addEventListener("recentlyViewedUpdate", handler);
    return () => window.removeEventListener("recentlyViewedUpdate", handler);
  }, []);

  const fetchEntities = useCallback(() => {
    fetch("/api/admin/entities")
      .then((r) => r.json())
      .then((list) => setEntities(Array.isArray(list) ? list : []))
      .catch(() => setEntities([]));
  }, []);

  useEffect(() => fetchEntities(), []);
  usePolling(fetchEntities);

  const nav = [
    { href: "/", label: "לוח בקרה", icon: LayoutDashboard },
    ...entities
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((e) => {
        const Icon = getEntityIcon(e.icon);
        return {
          href: `/dynamic/${e.slug}`,
          label: e.name,
          icon: Icon,
        };
      }),
    { href: "/admin/entities", label: "כרטיסים", icon: Layers },
    { href: "/reports", label: "דוחות", icon: BarChart3 },
    { href: "/integrations", label: "ממשקים", icon: Plug },
    { href: "/admin", label: "ניהול", icon: Settings },
    ...(isAdmin ? [{ href: "/admin/users", label: "משתמשים", icon: Users }] : []),
    ...(isAdmin ? [{ href: "/admin/backups", label: "גיבויים", icon: Database }] : []),
  ];

  return (
    <aside className="fixed right-0 top-0 z-40 h-screen w-56 border-l border-slate-200 bg-white shadow-sm print:hidden">
      <div className="flex h-16 items-center justify-center border-b border-slate-200">
        <span className="text-xl font-bold text-primary-600">CRM</span>
      </div>
      {recent.length > 0 && (
        <div className="border-b border-slate-200 px-3 py-4">
          <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Clock className="h-4 w-4" />
            נצפה לאחרונה
          </h3>
          <div className="space-y-1">
            {recent.slice(0, 5).map((r) => (
              <Link
                key={`${r.entitySlug}-${r.recordId}`}
                href={`/dynamic/${r.entitySlug}/${r.recordId}`}
                className="block truncate rounded-lg px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                {r.title}
              </Link>
            ))}
          </div>
        </div>
      )}
      <nav className="mt-6 space-y-1 px-3">
        {nav.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && item.href !== "/admin" && item.href !== "/reports" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-50 text-primary-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
