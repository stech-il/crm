"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Shield, ShieldCheck, Copy, Check } from "lucide-react";

export default function SettingsPage() {
  const [twoFaEnabled, setTwoFaEnabled] = useState<boolean | null>(null);
  const [setupSecret, setSetupSecret] = useState<string | null>(null);
  const [setupUrl, setSetupUrl] = useState<string | null>(null);
  const [setupCode, setSetupCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const fetchStatus = () => {
    fetch("/api/auth/2fa/status")
      .then((r) => r.json())
      .then((data) => setTwoFaEnabled(data.enabled === true))
      .catch(() => setTwoFaEnabled(false));
  };

  useEffect(() => fetchStatus(), []);

  const startEnable = () => {
    setError("");
    setMessage("");
    fetch("/api/auth/2fa/setup")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setSetupSecret(data.secret);
        setSetupUrl(data.url);
      })
      .catch((e) => setError(e.message || "שגיאה"));
  };

  const confirmEnable = async () => {
    if (!setupSecret || setupCode.length !== 6) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/2fa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: setupSecret, code: setupCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שגיאה");
      setMessage("אימות דו-שלבי הופעל");
      setSetupSecret(null);
      setSetupUrl(null);
      setSetupCode("");
      fetchStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה");
    } finally {
      setLoading(false);
    }
  };

  const cancelSetup = () => {
    setSetupSecret(null);
    setSetupUrl(null);
    setSetupCode("");
    setError("");
  };

  const disable2FA = async () => {
    if (disableCode.length !== 6) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: disableCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שגיאה");
      setMessage("אימות דו-שלבי כובה");
      setDisableCode("");
      fetchStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-2">
        <Link href="/" className="flex items-center gap-1 text-slate-600 hover:text-slate-800">
          <ChevronLeft className="h-4 w-4" /> חזרה
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-8">הגדרות</h1>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm max-w-lg">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-2">
          <Shield className="h-5 w-5" />
          אימות דו-שלבי (2FA)
        </h2>
        <p className="text-sm text-slate-600 mb-4">
          הוסף שכבת אבטחה עם קוד מהאפליקציה (Google Authenticator, Authy וכדומה).
        </p>
        {message && <p className="text-sm text-emerald-600 mb-4">{message}</p>}
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        {twoFaEnabled === true && !setupSecret && (
          <div>
            <p className="text-sm text-slate-600 mb-2 flex items-center gap-1">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              אימות דו-שלבי מופעל
            </p>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ""))}
                placeholder="קוד לאישור כיבוי"
                className="rounded-lg border border-slate-300 px-3 py-2 w-32 text-center"
              />
              <button
                onClick={disable2FA}
                disabled={loading || disableCode.length !== 6}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                כבה 2FA
              </button>
            </div>
          </div>
        )}

        {twoFaEnabled === false && !setupSecret && (
          <button
            onClick={startEnable}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            הפעל אימות דו-שלבי
          </button>
        )}

        {setupSecret && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              סרוק את ה-QR באפליקציה או הזן את המפתח ידנית:
            </p>
            {setupUrl && (
              <div className="flex flex-col items-start gap-2">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(decodeURIComponent(setupUrl))}`}
                  alt="QR לאימות דו-שלבי"
                  className="rounded border border-slate-200"
                />
                <button
                  type="button"
                  onClick={() => {
                    const url = decodeURIComponent(setupUrl);
                    navigator.clipboard.writeText(url).then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    });
                  }}
                  className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  {copied ? "הועתק" : "העתק קישור להגדרה באפליקציה"}
                </button>
              </div>
            )}
            <p className="font-mono text-xs bg-slate-100 p-3 rounded break-all">{setupSecret}</p>
            <p className="text-sm text-slate-600">הזן קוד מהאפליקציה לאישור:</p>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={setupCode}
                onChange={(e) => setSetupCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="rounded-lg border border-slate-300 px-3 py-2 w-32 text-center"
              />
              <button
                onClick={confirmEnable}
                disabled={loading || setupCode.length !== 6}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? "שומר..." : "אשר והפעל"}
              </button>
              <button onClick={cancelSetup} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                ביטול
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
