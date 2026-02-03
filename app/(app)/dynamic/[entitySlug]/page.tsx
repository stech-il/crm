import DynamicListWrapper from "@/components/DynamicListWrapper";

export default async function DynamicEntityPage({
  params,
}: {
  params: Promise<{ entitySlug: string }>;
}) {
  const { entitySlug } = await params;
  return <DynamicListWrapper entitySlug={entitySlug} />;
}
