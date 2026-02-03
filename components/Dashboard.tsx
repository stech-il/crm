"use client";

import { useEffect, useState } from "react";
import { Users, Briefcase, DollarSign, TrendingUp } from "lucide-react";

const STAGE_LABELS: Record<string, string> = {
  lead: "ליד",
  qualified: "איכותי",
  proposal: "הצעה",
  negotiation: "משא ומתן",
  closed_won: "נסגר בהצלחה",
  closed_lost: "נסגר בהפסד",
};

export default function Dashboard() {
  const [data, setData] = useState<{
    contactsCount: number;
    dealsCount: number;
    totalValue: number;
    dealsByStage: Record<string, { count: number; value: number }>;
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
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-lg bg-slate-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const cards = [
    { label: "אנשי קשר", value: data.contactsCount, icon: Users, color: "bg-blue-500" },
    { label: "עסקאות", value: data.dealsCount, icon: Briefcase, color: "bg-emerald-500" },
    { label: "ערך כולל (₪)", value: data.totalValue.toLocaleString("he-IL"), icon: DollarSign, color: "bg-amber-500" },
  ];

  return (
    <div className="p-8">
      <h1 className="mb-8 text-2xl font-bold text-slate-800">לוח בקרה</h1>

      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
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
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
          <TrendingUp className="h-5 w-5" />
          עסקאות לפי שלב
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {Object.entries(data.dealsByStage).map(([stage, { count, value }]) => (
            <div
              key={stage}
              className="rounded-lg border border-slate-100 bg-slate-50 p-4"
            >
              <p className="text-sm font-medium text-slate-600">
                {STAGE_LABELS[stage] ?? stage}
              </p>
              <p className="mt-1 text-xl font-bold text-slate-800">{count}</p>
              <p className="text-sm text-slate-500">₪{value.toLocaleString("he-IL")}</p>
            </div>
          ))}
        </div>
        {Object.keys(data.dealsByStage).length === 0 && (
          <p className="text-center text-slate-500">אין עסקאות עדיין</p>
        )}
      </div>
    </div>
  );
}
