"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Award, CheckSquare, Briefcase, DollarSign } from "lucide-react";

export default function Dashboard() {
  const [data, setData] = useState<{
    customersCount: number;
    certificationsCount: number;
    tasksCount: number;
    openTasksCount: number;
    totalValue?: number;
  } | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-slate-200" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 rounded-lg bg-slate-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const cards = [
    { label: "לקוחות", value: data.customersCount, icon: Users, href: "/customers", color: "bg-blue-500" },
    { label: "אישורי כשרות", value: data.certificationsCount, icon: Award, href: "/certifications", color: "bg-emerald-500" },
    { label: "משימות פתוחות", value: data.openTasksCount, icon: CheckSquare, href: "/tasks", color: "bg-amber-500" },
    { label: "עסקאות", value: data.totalValue?.toLocaleString("he-IL") ?? "0", icon: DollarSign, href: "/deals", color: "bg-purple-500" },
  ];

  return (
    <div className="p-8">
      <h1 className="mb-8 text-2xl font-bold text-slate-800">לוח בקרה</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-800">{card.value}</p>
                </div>
                <div className={`rounded-lg p-3 ${card.color} text-white`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
