"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [step, setStep] = useState<"password" | "totp">("password");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      totpCode: step === "totp" ? totpCode : undefined,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      if (res.error === "NEED_TOTP") {
        setStep("totp");
        setError("");
        return;
      }
      setError(res.error === "CredentialsSignin" ? "אימייל או סיסמה שגויים" : String(res.error));
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold text-slate-800">התחברות ל-CRM</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {step === "password" && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-600">אימייל</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600">סיסמה</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
            </>
          )}
          {step === "totp" && (
            <>
              <p className="text-sm text-slate-600">הזן את הקוד בן 6 הספרות מהאפליקציה</p>
              <div>
                <label className="block text-sm font-medium text-slate-600">קוד אימות</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-center text-lg tracking-widest"
                />
              </div>
              <button
                type="button"
                onClick={() => { setStep("password"); setTotpCode(""); setError(""); }}
                className="text-sm text-slate-500 hover:underline"
              >
                ← חזרה לסיסמה
              </button>
            </>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading || (step === "totp" && totpCode.length !== 6)}
            className="w-full rounded-lg bg-primary-600 py-2 font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? "מתחבר..." : step === "totp" ? "אימות" : "התחבר"}
          </button>
        </form>
        {step === "password" && (
          <p className="mt-4 text-center text-sm text-slate-500">
            <Link href="/forgot-password" className="text-primary-600 hover:underline">
              שכחתי סיסמה
            </Link>
            {" · "}
            אין לך חשבון?{" "}
            <Link href="/register" className="text-primary-600 hover:underline">
              הרשם
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
