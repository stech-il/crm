import DynamicFormPage from "../../../../../components/DynamicFormPage";

export default async function NewDynamicRecordPage({
  params,
}: {
  params: Promise<{ entitySlug: string }>;
}) {
  const { entitySlug } = await params;
  return <DynamicFormPage entitySlug={entitySlug} />;
}
