"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Award,
  ShoppingCart,
  CheckSquare,
  Package,
  Briefcase,
} from "lucide-react";
import clsx from "clsx";

const nav = [
  { href: "/", label: "לוח בקרה", icon: LayoutDashboard },
  { href: "/customers", label: "לקוחות", icon: Users },
  { href: "/certifications", label: "אישורי כשרות", icon: Award },
  { href: "/orders", label: "הזמנות", icon: ShoppingCart },
  { href: "/tasks", label: "משימות", icon: CheckSquare },
  { href: "/products", label: "מוצרים", icon: Package },
  { href: "/deals", label: "עסקאות", icon: Briefcase },
  { href: "/contacts", label: "אנשי קשר", icon: UserCircle },
];

export default function Sidebar() {
  const pathname = usePathname();

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
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
