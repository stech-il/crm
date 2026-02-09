import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { createActivity } from "@/lib/activity";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entitySlug: string }> }
) {
  const { entitySlug } = await params;
  try {
    const entity = await prisma.entity.findUnique({
      where: { slug: entitySlug },
      include: { fields: { orderBy: { order: "asc" } } },
    });
    if (!entity) return NextResponse.json({ error: "Entity not found" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const filterJson = searchParams.get("filter");
    const sortJson = searchParams.get("sort");
    const format = searchParams.get("format");
    const includeArchived = searchParams.get("archived") === "1";

    const where: { entityId: string; isArchived?: boolean } = { entityId: entity.id };
    if (!includeArchived) where.isArchived = false;

    let records = await prisma.dynamicRecord.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    if (search) {
      records = records.filter((r) => {
        const str = JSON.stringify(r.data).toLowerCase();
        return str.includes(search.toLowerCase());
      });
    }

    if (filterJson) {
      try {
        const filters = JSON.parse(filterJson) as { field: string; op: string; value: string }[];
        for (const f of filters) {
          if (!f.field || !f.value) continue;
          records = records.filter((r) => {
            const val = (r.data as Record<string, unknown>)[f.field];
            const strVal = String(val ?? "").toLowerCase();
            const searchVal = String(f.value).toLowerCase();
            if (f.op === "contains") return strVal.includes(searchVal);
            if (f.op === "equals") return strVal === searchVal;
            if (f.op === "startsWith") return strVal.startsWith(searchVal);
            return true;
          });
        }
      } catch {
        /* invalid filter */
      }
    }

    if (sortJson) {
      try {
        const { field, dir } = JSON.parse(sortJson) as { field: string; dir: "asc" | "desc" };
        if (field) {
          const mult = dir === "asc" ? 1 : -1;
          records = [...records].sort((a, b) => {
            if (field === "updatedAt" || field === "createdAt") {
              const da = new Date((a as { updatedAt?: Date; createdAt?: Date })[field as "updatedAt" | "createdAt"] || 0).getTime();
              const db = new Date((b as { updatedAt?: Date; createdAt?: Date })[field as "updatedAt" | "createdAt"] || 0).getTime();
              return (da - db) * mult;
            }
            const va = (a.data as Record<string, unknown>)[field];
            const vb = (b.data as Record<string, unknown>)[field];
            const sa = String(va ?? "").localeCompare(String(vb ?? ""), "he");
            return sa * mult;
          });
        }
      } catch {
        /* invalid sort */
      }
    }

    if (format === "csv") {
      const fields = entity.fields.filter((f) => f.showInList !== false);
      const headers = ["id", ...fields.map((f) => f.label), "updatedAt"];
      const rows = records.map((r) => {
        const d = r.data as Record<string, unknown>;
        const cells = [
          r.id,
          ...fields.map((f) => {
            const v = d[f.name];
            if (v == null) return "";
            if (typeof v === "object" && v !== null && "url" in v) return (v as { url?: string }).url || "";
            return String(v).replace(/"/g, '""');
          }),
          new Date(r.updatedAt).toLocaleString("he-IL"),
        ];
        return cells.map((c) => `"${c}"`).join(",");
      });
      const csv = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${entitySlug}-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json({ entity, records });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ entitySlug: string }> }
) {
  const { entitySlug } = await params;
  try {
    const { getSession } = await import("@/lib/auth");
    const session = await getSession();
    const entity = await prisma.entity.findUnique({
      where: { slug: entitySlug },
      include: { fields: true },
    });
    if (!entity) return NextResponse.json({ error: "Entity not found" }, { status: 404 });

    const body = await request.json();
    const createdById = (session?.user as { id?: string })?.id || null;
    const copyTasks = body.copyTasks === true;
    const sourceRecordId = body.sourceRecordId;

    const record = await prisma.dynamicRecord.create({
      data: {
        entityId: entity.id,
        data: body.data || {},
        createdById,
      },
    });
    await createActivity(record.id, "created", null, createdById);

    if (copyTasks && sourceRecordId) {
      const tasks = await prisma.recordTask.findMany({
        where: { recordId: sourceRecordId },
        orderBy: { order: "asc" },
      });
      for (const t of tasks) {
        await prisma.recordTask.create({
          data: {
            recordId: record.id,
            title: t.title,
            done: false,
            dueDate: t.dueDate,
            order: t.order,
            createdById,
          },
        });
      }
    }
    return NextResponse.json(record);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create record" }, { status: 500 });
  }
}
