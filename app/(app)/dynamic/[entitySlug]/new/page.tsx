import { Suspense } from "react";
import DynamicFormPage from "@/components/DynamicFormPage";

export default async function NewDynamicRecordPage({
  params,
}: {
  params: Promise<{ entitySlug: string }>;
}) {
  const { entitySlug } = await params;
  return (
    <Suspense fallback={<div className="p-8 animate-pulse h-64 rounded bg-slate-200" />}>
      <DynamicFormPage entitySlug={entitySlug} />
    </Suspense>
  );
}
