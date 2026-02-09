import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/lib/auth";
import { createActivity } from "@/lib/activity";
import { triggerWebhooks } from "@/lib/webhooks";
import { logAudit } from "@/lib/audit";

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (inQuotes) {
      cell += c;
    } else if (c === "," || c === "\t") {
      current.push(cell.trim());
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      current.push(cell.trim());
      cell = "";
      if (current.some((x) => x)) rows.push(current);
      current = [];
    } else {
      cell += c;
    }
  }
  if (cell || current.length) {
    current.push(cell.trim());
    if (current.some((x) => x)) rows.push(current);
  }
  return rows;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ entitySlug: string }> }
) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "לא מורשה" }, { status: 401 });

  const { entitySlug } = await params;
  const entity = await prisma.entity.findUnique({
    where: { slug: entitySlug },
    include: { fields: { orderBy: { order: "asc" } } },
  });
  if (!entity) return NextResponse.json({ error: "Entity not found" }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "חסר קובץ" }, { status: 400 });

  const text = await file.text();
  const rows = parseCsv(text);
  if (rows.length < 2) return NextResponse.json({ error: "הקובץ ריק או חסר שורת כותרות" }, { status: 400 });

  const headers = rows[0].map((h) => h.replace(/^["']|["']$/g, "").trim());
  const fieldNames = new Set(entity.fields.map((f) => f.name));
  const headerToField: Record<string, string> = {};
  const labelToName = Object.fromEntries(entity.fields.map((f) => [f.label.toLowerCase(), f.name]));

  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];
    if (!h) continue;
    const name = fieldNames.has(h) ? h : labelToName[h.toLowerCase()] || entity.fields.find((f) => f.label === h)?.name;
    if (name) headerToField[String(i)] = name;
  }

  const createdById = (session.user as { id?: string }).id || null;
  const created: string[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const data: Record<string, unknown> = {};
    for (const [colIdx, fieldName] of Object.entries(headerToField)) {
      const idx = parseInt(colIdx, 10);
      const val = row[idx];
      if (val !== undefined && val !== "") {
        const field = entity.fields.find((f) => f.name === fieldName);
        if (field?.type === "number") data[fieldName] = parseFloat(val) || 0;
        else if (field?.type === "checkbox") data[fieldName] = ["1", "true", "yes", "כן", "x"].includes(val.toLowerCase());
        else data[fieldName] = val;
      }
    }
    try {
      const record = await prisma.dynamicRecord.create({
        data: { entityId: entity.id, data, createdById },
      });
      await createActivity(record.id, "created", null, createdById);
      await triggerWebhooks("record.created", entitySlug, record.id, data);
      created.push(record.id);
    } catch (err) {
      errors.push({ row: r + 1, message: err instanceof Error ? err.message : "שגיאה" });
    }
  }

  await logAudit({
    userId: createdById ?? undefined,
    action: "record.create",
    entitySlug,
    details: { import: true, count: created.length, errors: errors.length },
  });

  return NextResponse.json({
    imported: created.length,
    total: rows.length - 1,
    errors: errors.length,
    errorDetails: errors.slice(0, 10),
  });
}
