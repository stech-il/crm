export type FieldDef = {
  id: string;
  name: string;
  label: string;
  type: string;
  options?: string | null;  // optional to accept API/Prisma response (undefined) and null
  required?: boolean;
  placeholder?: string | null;
  section?: string | null;
  order?: number;
};

/** Normalize API entity to DynamicEntity - ensures options is string | null (not undefined) for type compatibility */
export function normalizeEntity(raw: {
  id: string;
  name: string;
  slug: string;
  fields?: Array<{
    id: string;
    name: string;
    label: string;
    type: string;
    options?: string | null;
    required?: boolean;
    placeholder?: string | null;
    section?: string | null;
    order?: number;
  }>;
}): DynamicEntity {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    fields: (raw.fields ?? []).map((f) => ({
      id: f.id,
      name: f.name,
      label: f.label,
      type: f.type,
      options: f.options ?? null,
      required: f.required,
      placeholder: f.placeholder ?? null,
      section: f.section ?? null,
      order: f.order ?? 0,
    })),
  };
}

export type DynamicEntity = {
  id: string;
  name: string;
  slug: string;
  fields: FieldDef[];
};
