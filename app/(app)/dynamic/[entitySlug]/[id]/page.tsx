import DynamicDetailPage from "../../../../components/DynamicDetailPage";

export default async function DynamicRecordDetailPage({
  params,
}: {
  params: Promise<{ entitySlug: string; id: string }>;
}) {
  const { entitySlug, id } = await params;
  return <DynamicDetailPage entitySlug={entitySlug} recordId={id} />;
}
