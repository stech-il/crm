import { prisma } from "@/app/lib/db";
import { createActivity } from "@/lib/activity";

type RecordData = Record<string, unknown>;

function matchCondition(condition: string | null, data: RecordData): boolean {
  if (!condition) return true;
  try {
    const c = JSON.parse(condition) as { field?: string; op?: string; value?: string };
    if (!c.field) return true;
    const val = data[c.field];
    const strVal = String(val ?? "").toLowerCase();
    const want = String(c.value ?? "").toLowerCase();
    if (c.op === "equals") return strVal === want;
    if (c.op === "contains") return strVal.includes(want);
    if (c.op === "notEmpty") return strVal.length > 0;
    return true;
  } catch {
    return false;
  }
}

export async function runWorkflowRules(
  entitySlug: string,
  trigger: "record.created" | "record.updated",
  recordId: string,
  data: RecordData
) {
  const rules = await prisma.workflowRule.findMany({
    where: { entitySlug, trigger, isActive: true },
  });
  for (const rule of rules) {
    if (!matchCondition(rule.condition, data)) continue;
    try {
      const config = rule.actionConfig ? (JSON.parse(rule.actionConfig) as Record<string, string>) : {};
      if (rule.action === "create_task" && config.taskTitle) {
        const maxOrder = await prisma.recordTask.aggregate({ where: { recordId }, _max: { order: true } }).then((r) => r._max.order ?? -1);
        await prisma.recordTask.create({
          data: { recordId, title: config.taskTitle, order: maxOrder + 1 },
        });
        await createActivity(recordId, "task_added", config.taskTitle, null);
      }
      if (rule.action === "call_webhook" && config.webhookUrl) {
        await fetch(config.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event: trigger, entitySlug, recordId, data }),
        });
      }
    } catch (e) {
      console.error("Workflow rule error:", rule.id, e);
    }
  }
}
