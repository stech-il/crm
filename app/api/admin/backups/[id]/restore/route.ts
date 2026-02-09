/**
 * API שחזור מגיבוי - רק אדמין
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/lib/auth";

async function requireAdmin() {
  const session = await getSession();
  if (!session?.user) return null;
  const user = await prisma.user.findUnique({
    where: { id: (session.user as { id?: string }).id },
    select: { role: true },
  });
  return user?.role === "admin" ? session : null;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "לא מורשה" }, { status: 403 });

  const { id } = await params;
  try {
    const backup = await prisma.backup.findUnique({ where: { id } });
    if (!backup) return NextResponse.json({ error: "גיבוי לא נמצא" }, { status: 404 });

    const b = backup.data as { version?: number; data?: { users?: unknown[]; entities?: unknown[]; fieldDefinitions?: unknown[]; records?: unknown[]; tasks?: unknown[]; callLogs?: unknown[]; notes?: unknown[] } };
    const data = b?.data;
    if (!data) return NextResponse.json({ error: "פורמט גיבוי לא תקין" }, { status: 400 });

    await prisma.$transaction(async (tx) => {
      await tx.callLog.deleteMany();
      await tx.recordTask.deleteMany();
      await tx.recordNote.deleteMany();
      await tx.dynamicRecord.deleteMany();
      await tx.fieldDefinition.deleteMany();
      await tx.entity.deleteMany();
      await tx.dynamicActivity.deleteMany();
      await tx.recordFile.deleteMany();

      const entities = (data.entities || []) as { id: string; name: string; slug: string; icon?: string; order?: number }[];
      const entityIdMap: Record<string, string> = {};
      for (const e of entities) {
        const created = await tx.entity.create({
          data: { name: e.name, slug: e.slug, icon: e.icon, order: e.order ?? 0 },
        });
        entityIdMap[e.id] = created.id;
      }

      const fieldDefs = (data.fieldDefinitions || []) as { id: string; entityId: string; name: string; label: string; type: string; options?: string; required?: boolean; order?: number; section?: string; showInList?: boolean; showInCard?: boolean }[];
      const fieldIdMap: Record<string, string> = {};
      for (const f of fieldDefs) {
        const newEntityId = entityIdMap[f.entityId];
        if (!newEntityId) continue;
        const created = await tx.fieldDefinition.create({
          data: {
            entityId: newEntityId,
            name: f.name,
            label: f.label,
            type: f.type,
            options: f.options,
            required: f.required ?? false,
            order: f.order ?? 0,
            section: f.section,
            showInList: f.showInList ?? true,
            showInCard: f.showInCard ?? true,
          },
        });
        fieldIdMap[f.id] = created.id;
      }

      const records = (data.records || []) as { id: string; entityId: string; data: object; createdById?: string }[];
      const recordIdMap: Record<string, string> = {};
      for (const r of records) {
        const newEntityId = entityIdMap[r.entityId];
        if (!newEntityId) continue;
        const created = await tx.dynamicRecord.create({
          data: { entityId: newEntityId, data: r.data, createdById: r.createdById },
        });
        recordIdMap[r.id] = created.id;
      }

      const tasks = (data.tasks || []) as { recordId: string; title: string; done: boolean; order: number; dueDate?: string | Date | null }[];
      for (const t of tasks) {
        const newRecordId = recordIdMap[t.recordId];
        if (!newRecordId) continue;
        await tx.recordTask.create({
          data: {
            recordId: newRecordId,
            title: t.title,
            done: t.done ?? false,
            order: t.order ?? 0,
            dueDate: t.dueDate ? new Date(t.dueDate) : null,
          },
        });
      }

      const callLogs = (data.callLogs || []) as { recordId?: string; phoneNumber: string; direction: string; duration?: number; notes?: string }[];
      for (const c of callLogs) {
        const newRecordId = c.recordId ? recordIdMap[c.recordId] : null;
        await tx.callLog.create({
          data: {
            recordId: newRecordId,
            phoneNumber: c.phoneNumber,
            direction: c.direction || "outgoing",
            duration: c.duration,
            notes: c.notes,
          },
        });
      }

      const notes = (data.notes || []) as { recordId: string; content: string; createdById?: string }[];
      for (const n of notes) {
        const newRecordId = recordIdMap[n.recordId];
        if (!newRecordId) continue;
        await tx.recordNote.create({
          data: { recordId: newRecordId, content: n.content, createdById: n.createdById },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Restore error:", error);
    return NextResponse.json({ error: "שגיאה בשחזור" }, { status: 500 });
  }
}
