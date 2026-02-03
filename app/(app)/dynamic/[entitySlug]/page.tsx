import DynamicList from "@/components/DynamicList";

export default async function DynamicEntityPage({
  params,
}: {
  params: Promise<{ entitySlug: string }>;
}) {
  const { entitySlug } = await params;
  return <DynamicList entitySlug={entitySlug} />;
}
