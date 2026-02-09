import type { Metadata } from "next";
import "./globals.css";
import SessionProvider from "../components/SessionProvider";
import ThemeProvider from "../components/ThemeProvider";

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
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased dark:bg-slate-900 dark:text-slate-100">
        <ThemeProvider>
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
