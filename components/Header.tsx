"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { User, Settings } from "lucide-react";

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 text-white">
            <span className="text-sm font-bold">CRM</span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/admin"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          title="הגדרות"
        >
          <Settings className="h-5 w-5" />
        </Link>
        <div className="mr-2 h-8 w-px bg-slate-200" />
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600">
            <User className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-800">{session?.user?.name}</span>
            <span className="text-xs text-slate-500">{session?.user?.email}</span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mr-2 text-sm text-slate-500 hover:text-slate-700"
          >
            התנתק
          </button>
        </div>
      </div>
    </header>
  );
}
