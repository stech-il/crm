"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, Users } from "lucide-react";
import { getEntityIcon } from "../lib/entityIcons";
import { usePolling } from "../lib/usePolling";
import clsx from "clsx";

type Entity = { id: string; name: string; slug: string; icon?: string | null; order: number };

export default function Sidebar() {
  const pathname = usePathname();
  const [entities, setEntities] = useState<Entity[]>([]);

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
    { href: "/admin", label: "ניהול", icon: Settings },
    { href: "/admin/users", label: "משתמשים", icon: Users },
  ];

  return (
    <aside className="fixed right-0 top-0 z-40 h-screen w-56 border-l border-slate-200 bg-white shadow-sm">
      <div className="flex h-16 items-center justify-center border-b border-slate-200">
        <span className="text-xl font-bold text-primary-600">CRM</span>
      </div>
      <nav className="mt-6 space-y-1 px-3">
        {nav.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
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
