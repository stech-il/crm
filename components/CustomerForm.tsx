"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import CollapsibleSection from "./CollapsibleSection";

type User = { id: string; name: string };

export default function CustomerForm() {
  const router = useRouter();
  const urlParams = useParams();
  const id = urlParams?.id as string | undefined;
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string | number>>({
    name: "",
    primaryPhone: "",
    secondaryPhone: "",
    contactPersonPhone: "",
    familyMemberPhone: "",
    primaryPhoneName: "",
    secondaryPhoneName: "",
    billingEmail: "",
    invoiceName: "",
    paymentTerms: "",
    paymentDayProcedure: "",
    note: "",
    settlement: "",
    street: "",
    houseNumber: "",
    apartment: "",
    floor: "",
    neighborhood: "",
    area: "",
    businessDays: "",
    email1: "",
    email2: "",
    managerId: "",
    sourceOfArrival: "",
    sourceDetails: "",
    sourceNote: "",
    treatmentStatus: "",
    reasonIfNotClosed: "",
    customerStatus: "לקוח",
    primaryProductStatus: "",
    secondaryProductStatus: "",
    centralInvoice: "",
    donationStatus: "לא הוצע לו להיות שותף",
    donationAmount: 0,
    arrivalNotes: "",
  });

  useEffect(() => {
    fetch("/api/users").then((r) => r.json()).then(setUsers);
  }, []);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    fetch(`/api/customers/${id}`)
      .then((r) => r.json())
      .then((data) => {
        const f: Record<string, string | number> = { ...form };
        Object.keys(data).forEach((k) => {
          if (data[k] !== null && data[k] !== undefined && typeof data[k] !== "object") {
            f[k] = data[k];
          }
        });
        setForm(f);
        setLoading(false);
      });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form };
    if (payload.managerId === "") payload.managerId = null;
    if (id) {
      await fetch(`/api/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      router.push(`/customers/${id!}`);
    } else {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      router.push(`/customers/${data.id}`);
    }
    setSaving(false);
  };

  const input = (key: string, label: string, required = false) => (
    <div key={key}>
      <label className="block text-sm font-medium text-slate-600">
        {label} {required && <span className="text-red-500">•</span>}
      </label>
      <input
        value={form[key] ?? ""}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        required={required}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      />
    </div>
  );

  const select = (key: string, label: string, options: string[]) => (
    <div key={key}>
      <label className="block text-sm font-medium text-slate-600">{label}</label>
      <select
        value={form[key] ?? ""}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
      >
        <option value="">בחר...</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-slate-200" />
          <div className="h-64 rounded bg-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-800">לקוח</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <CollapsibleSection title="מידע על הלקוח" defaultOpen={true}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              {input("sourceOfArrival", "מקור הגעה", true)}
              {input("sourceDetails", "פרטי מקור הגעה", true)}
              {input("sourceNote", "הערה מקור הגעה")}
            </div>
            <div className="space-y-4">
              {input("treatmentStatus", "סטטוס טיפול")}
              {input("reasonIfNotClosed", "סיבה אם לא סגר", true)}
              {input("customerStatus", "סטאטוס לקוח")}
              {input("primaryProductStatus", "סטטוס התקנה מוצר ראשי")}
              {input("secondaryProductStatus", "סטטוס התקנה מוצר משני")}
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="פרטי לקוח בסיסיים" defaultOpen={true}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              {input("name", "שם לקוח", true)}
              {input("primaryPhone", "טלפון ראשי", true)}
              {input("secondaryPhone", "טלפון משני")}
              {input("contactPersonPhone", "טלפון איש קשר")}
              {input("billingEmail", "מייל הנהלת חשבונות")}
              <div>
                <label className="block text-sm font-medium text-slate-600">מנהל לקוח •</label>
                <select
                  value={form.managerId ?? ""}
                  onChange={(e) => setForm({ ...form, managerId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="">בחר...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-4">
              {input("familyMemberPhone", "טלפון של בן משפחה")}
              {input("primaryPhoneName", "שם טלפון ראשי")}
              {input("secondaryPhoneName", "שם טלפון משני")}
              {input("note", "הערה")}
              {input("invoiceName", "שם עבור חשבונית")}
              {input("paymentTerms", "תנאי תשלום")}
              {input("paymentDayProcedure", "נוהל יום התשלומים")}
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="כתובת" defaultOpen={false}>
          <div className="grid gap-4 md:grid-cols-2">
            {input("settlement", "ישוב")}
            {input("street", "רחוב")}
            {input("houseNumber", "מס' בית וכניסה")}
            {input("apartment", "דירה")}
            {input("floor", "קומה")}
            {input("neighborhood", "שכונה")}
            {input("area", "אזור")}
            {input("businessDays", "ימי עסקים- ישוב")}
            {input("email1", "דואר אלקטרוני 1")}
            {input("email2", "דואר אלקטרוני 2")}
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="חשבוניות" defaultOpen={false}>
          {input("centralInvoice", "הנפקת חשבונית מרכזת")}
        </CollapsibleSection>

        <CollapsibleSection title="פרטי תרומה" defaultOpen={false}>
          <div className="grid gap-4 md:grid-cols-2">
            {select("donationStatus", "סטטוס תרומה •", [
              "לא הוצע לו להיות שותף",
              "הוצע - לא ענה",
              "הוצע - סירב",
              "הוצע - הסכים",
            ])}
            <div>
              <label className="block text-sm font-medium text-slate-600">סכום</label>
              <input
                type="number"
                value={form.donationAmount ?? 0}
                onChange={(e) => setForm({ ...form, donationAmount: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="הערות הגעה" defaultOpen={false}>
          <div>
            <label className="block text-sm font-medium text-slate-600">הערות הגעה לכתובת</label>
            <textarea
              value={form.arrivalNotes ?? ""}
              onChange={(e) => setForm({ ...form, arrivalNotes: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
        </CollapsibleSection>

        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            שמור
          </button>
          <Link
            href={id ? `/customers/${id}` : "/customers"}
            className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-600 hover:bg-slate-50"
          >
            בטל
          </Link>
        </div>
      </form>
    </div>
  );
}
