"use client";

import { useEffect, useRef, useCallback } from "react";
import { signOut } from "next-auth/react";

const EVENTS = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];

type Props = {
  children: React.ReactNode;
  timeoutMinutes?: number;
};

export default function InactivityTimeout({ children, timeoutMinutes = 5 }: Props) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutMs = timeoutMinutes * 60 * 1000;

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      signOut({ callbackUrl: "/login" });
    }, timeoutMs);
  }, [timeoutMs]);

  useEffect(() => {
    resetTimer();

    const handleActivity = () => resetTimer();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") resetTimer();
    };

    EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibility);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [resetTimer]);

  return <>{children}</>;
}
