"use client";

import DynamicList from "./DynamicList";

export default function DynamicListWrapper({ entitySlug }: { entitySlug: string }) {
  return <DynamicList entitySlug={entitySlug} />;
}
