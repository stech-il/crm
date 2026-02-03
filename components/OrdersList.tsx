"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

type Order = {
  id: string;
  status: string | null;
  total: number;
  createdAt: string;
  customer: { id: string; name: string };
};

export default function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => {
        setOrders(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse h-64 rounded bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">הזמנות</h1>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">לקוח</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">סטטוס</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">סה"כ</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">תאריך</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <Link href={`/customers/${o.customer.id}`} className="font-medium text-primary-600 hover:underline">
                    {o.customer.name}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm">{o.status ?? "—"}</td>
                <td className="px-6 py-4 text-sm">₪{o.total.toLocaleString("he-IL")}</td>
                <td className="px-6 py-4 text-sm">{new Date(o.createdAt).toLocaleDateString("he-IL")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <div className="py-16 text-center text-slate-500">אין הזמנות</div>
        )}
      </div>
    </div>
  );
}
