"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Keyboard } from "lucide-react";

const SHORTCUTS = [
  { keys: "G ‏→‏ D", desc: "לוח בקרה" },
  { keys: "G ‏→‏ A", desc: "ניהול" },
  { keys: "G ‏→‏ N", desc: "חדש (בכרטיס נוכחית)" },
  { keys: "/", desc: "מקד חיפוש" },
  { keys: "?", desc: "הצג קיצורי מקלדת" },
];

export default function KeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const onShow = () => setShowHelp(true);
    window.addEventListener("showKeyboardShortcuts", onShow);
    return () => window.removeEventListener("showKeyboardShortcuts", onShow);
  }, []);

  useEffect(() => {
    let gPressed = false;

    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable) {
        if (e.key !== "Escape") return;
      }

      if (e.key === "?") {
        e.preventDefault();
        setShowHelp((s) => !s);
        return;
      }
      if (showHelp && e.key === "Escape") {
        setShowHelp(false);
        return;
      }

      if (e.key === "g" || e.key === "G") {
        if (!gPressed) {
          gPressed = true;
          setTimeout(() => { gPressed = false; }, 500);
          return;
        }
      }

      if (gPressed || e.key === "g" || e.key === "G") {
        const next = e.key.toLowerCase();
        if (next === "d") {
          e.preventDefault();
          router.push("/");
        } else if (next === "a") {
          e.preventDefault();
          router.push("/admin");
        } else if (next === "n") {
          e.preventDefault();
          const match = pathname?.match(/\/dynamic\/([^/]+)/);
          if (match) router.push(`/dynamic/${match[1]}/new`);
        }
        gPressed = false;
      }

      if (e.key === "/" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        const search = document.querySelector<HTMLInputElement>('input[placeholder*="חיפוש"], input[placeholder*="Search"]');
        search?.focus();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router, pathname, showHelp]);

  if (!showHelp) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowHelp(false)}>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-4">
          <Keyboard className="h-5 w-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-800">קיצורי מקלדת</h2>
        </div>
        <div className="space-y-3">
          {SHORTCUTS.map((s) => (
            <div key={s.keys} className="flex justify-between items-center">
              <span className="text-slate-600">{s.desc}</span>
              <kbd className="rounded bg-slate-100 px-2 py-1 text-sm font-mono text-slate-700">{s.keys}</kbd>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-500">לחץ ? או ESC לסגירה</p>
      </div>
    </div>
  );
}
