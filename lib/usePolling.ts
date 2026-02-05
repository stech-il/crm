"use client";

import { useEffect, useRef, useCallback } from "react";

const POLL_INTERVAL_MS = 2000; // 2 שניות - עדכון כמעט בזמן אמת

/**
 * מפעיל רענון אוטומטי של נתונים כל כמה שניות.
 * מרענן רק כשהטאב גלוי (לא ברקע).
 */
export function usePolling(
  refetch: () => void,
  deps: React.DependencyList = [],
  intervalMs = POLL_INTERVAL_MS
) {
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  const stableRefetch = useCallback(() => {
    refetchRef.current();
  }, []);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") {
        refetchRef.current();
      }
    };
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, ...deps]);

  return stableRefetch;
}
