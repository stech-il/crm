import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-100">
          <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
