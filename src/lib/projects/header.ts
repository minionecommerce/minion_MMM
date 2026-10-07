// Changing the fields at the top of the Project page: Project Information, and the typed fields of the Financial Summary (Exclusions, Incentive %).
import { ZodError, type ZodIssue } from "zod";
import { prisma } from "@/lib/db";
import type { AuthContext } from "@/lib/auth";
import { removeObjects } from "@/lib/leads/storage";
import { getLayout } from "@/lib/records/layout";
import { bindFiles } from "@/lib/records/files";
import { getProjectDetail } from "./detail";
import { audit, changes, has, loadProject, lockProject, mergeCustom, need, splitValues, TX } from "./common";
import type { ProjectDetail } from "./types";

const issue = (key: string, message: string): ZodIssue => ({ code: "custom", path: ["values", key], message });
const time = (d: unknown) => (d instanceof Date ? d.getTime() : null);

export async function updateProjectValues(ctx: AuthContext, id: string, values: unknown): Promise<ProjectDetail> {
  need(ctx, "edit");
  const project = await loadProject(id);
  const layout = await getLayout("project");
  // the form sections (Project Information and any added in Edit Page Layout) and the typed fields of the Financial Summary
  const formSections = new Set(layout.sections.filter(s => s.kind === "FORM").map(s => s.id));
  const fields = layout.fields.filter(f => formSections.has(f.section) || f.section === "summary");
  const split = await splitValues(fields, values);

  const issues: ZodIssue[] = [];
  const c = split.columns;
  if (has(c, "status") && c.status === null) issues.push(issue("status", "Project Status cannot be empty"));
  if (has(c, "name") && c.name === null) issues.push(issue("name", "Project Name is required"));
  if (has(c, "progress") && c.progress !== null && (c.progress as number) > 100) issues.push(issue("progress", "Completion % cannot be more than 100"));
  if (has(c, "incentivePercent") && c.incentivePercent !== null && (c.incentivePercent as number) > 100) issues.push(issue("incentivePercent", "Incentive % cannot be more than 100"));
  // the dates, as they will be after this change
  const after = (key: "startDate" | "expectedEndDate" | "priorCompletionDate" | "actualStartDate" | "completedDate") => (has(c, key) ? time(c[key]) : time(project[key]));
  const order = (later: ReturnType<typeof after>, earlier: ReturnType<typeof after>, key: string, text: string) => {
    if (later !== null && earlier !== null && later < earlier) issues.push(issue(key, text));
  };
  if (["startDate", "expectedEndDate"].some(k => has(c, k))) order(after("expectedEndDate"), after("startDate"), "expectedEndDate", "The Project Completion Date cannot be before the Project Start Date");
  if (["startDate", "priorCompletionDate"].some(k => has(c, k))) order(after("priorCompletionDate"), after("startDate"), "priorCompletionDate", "The Prior Completion Date cannot be before the Project Start Date");
  if (["actualStartDate", "completedDate"].some(k => has(c, k))) order(after("completedDate"), after("actualStartDate"), "completedDate", "The Completed Date cannot be before the Actual Start Date");
  if (issues.length) throw new ZodError(issues);

  const removed: string[] = [];
  await prisma.$transaction(async tx => {
    await lockProject(tx, project.id);
    const record = project as unknown as Record<string, unknown>;
    const customBefore = record.customFields;
    await tx.project.update({
      where: { id: project.id },
      data: { ...split.columns, ...(Object.keys(split.custom).length ? { customFields: mergeCustom(customBefore, split.custom) } : {}), updatedById: ctx.userId },
    });
    if (split.slots.length) removed.push(...(await bindFiles(tx, ctx, "project", project.id, split.slots.map(s => ({ ...s, rowId: null })), [])));
    const diff = changes(record, { ...split.columns, ...Object.fromEntries(Object.entries(split.custom).map(([k, v]) => [`customFields.${k}`, v])) });
    if (Object.keys(diff.to).length || split.slots.length) await audit(tx, ctx, project, "Updated", diff.from, { ...diff.to, ...(split.slots.length ? { filesSaved: split.slots.map(s => s.fieldKey) } : {}) });
  }, TX);
  await removeObjects(removed);
  return getProjectDetail(ctx, id);
}
