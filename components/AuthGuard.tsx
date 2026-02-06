"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "loading") return;
    if (PUBLIC_PATHS.includes(pathname || "")) return;
    if (!session) {
      router.replace(`/login?callbackUrl=${encodeURIComponent(pathname || "/")}`);
    }
  }, [session, status, pathname, router]);

  if (PUBLIC_PATHS.includes(pathname || "")) {
    return <>{children}</>;
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
