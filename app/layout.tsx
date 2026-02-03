import type { Metadata } from "next";
import "./globals.css";
import SessionProvider from "../components/SessionProvider";

export const metadata: Metadata = {
  title: "CRM Cloud - ניהול לקוחות",
  description: "מערכת CRM בענן",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
