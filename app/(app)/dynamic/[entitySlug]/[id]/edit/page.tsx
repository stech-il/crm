import DynamicFormPage from "../../../../../../components/DynamicFormPage";

export default async function EditDynamicRecordPage({
  params,
}: {
  params: Promise<{ entitySlug: string; id: string }>;
}) {
  const { entitySlug, id } = await params;
  return <DynamicFormPage entitySlug={entitySlug} recordId={id} />;
}
