"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) setError("קישור לא תקף. נסה לבקש איפוס סיסמה מחדש.");
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (password !== confirm) {
      setError("הסיסמאות אינן תואמות");
      return;
    }
    if (password.length < 6) {
      setError("הסיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "שגיאה");
        return;
      }
      setMessage(data.message || "הסיסמה עודכנה. תוכל להתחבר כעת.");
    } catch {
      setError("שגיאה בחיבור");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg text-center">
          <p className="text-red-600">{error}</p>
          <Link href="/forgot-password" className="mt-4 inline-block text-primary-600 hover:underline">
            בקשת איפוס סיסמה
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold text-slate-800">הגדרת סיסמה חדשה</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600">סיסמה חדשה</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600">אימות סיסמה</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && (
            <p className="text-sm text-emerald-600">
              {message}{" "}
              <Link href="/login" className="font-medium underline">
                התחבר
              </Link>
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !!message}
            className="w-full rounded-lg bg-primary-600 py-2 font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? "שומר..." : "עדכן סיסמה"}
          </button>
        </form>
        <p className="mt-6 text-center">
          <Link href="/login" className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline">
            <ArrowRight className="h-4 w-4" />
            חזרה להתחברות
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-100">
          <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
