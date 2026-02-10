import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <h1 className="text-6xl font-bold text-slate-300 dark:text-slate-600">404</h1>
      <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">הדף המבוקש לא נמצא</p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-primary-600 px-6 py-3 font-medium text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 transition-colors"
      >
        חזרה ללוח הבקרה
      </Link>
    </div>
  );
}
