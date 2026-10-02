import { z } from "zod";
import { ALLOWED_ATTACHMENT_TYPES, MAX_ATTACHMENTS_PER_LEAD, MAX_ATTACHMENT_BYTES } from "./constants";
import { isHttpUrl, normalizePhone } from "./format";

// .strict(): unknown fields (createdById, leadCode, deletedAt, ...) are rejected, never silently applied.

const optionalId = z.string().trim().max(64).nullable().optional().transform(v => v || null);
const optionalText = (max: number) =>
  z.string().trim().max(max, `At most ${max} characters`).nullable().optional().transform(v => v || null);

export const leadInputSchema = z
  .object({
    customerName: z.string({ required_error: "Customer Name is required" }).trim().min(2, "Customer Name is required").max(120),
    contactNumber: z
      .string({ required_error: "Contact Number is required" })
      .trim()
      .min(1, "Contact Number is required")
      .max(30)
      .refine(v => normalizePhone(v) !== null, "Enter a valid contact number (7–15 digits)"),
    // Which of these are required is set in Edit Page Layout and checked in the service (checkLeadAgainstLayout)
    taskAssignedPersonId: optionalId,
    productOrServiceId: optionalId,
    requirementId: optionalId,
    exactRequirement: optionalText(2000),
    modeOfCustomerId: optionalId,
    sourceId: optionalId,
    location: optionalText(200),
    exactLocation: optionalText(300),
    locationLink: z
      .string()
      .trim()
      .max(2000)
      .nullable()
      .optional()
      .transform(v => v || null)
      .refine(v => v === null || isHttpUrl(v), "Enter a valid http(s) link"),
    mainCategoryId: optionalId,
    categoryId: optionalId,
    subcategoryId: optionalId,
    leadPersonId: optionalId,
    leadStatusId: optionalId,
    amount: z.number().min(0, "Amount cannot be negative").max(9999999999.99).nullable().optional().transform(v => v ?? null),
    conventionalRate: z.number().min(0).max(100).nullable().optional().transform(v => v ?? null),
    notes: optionalText(5000),
    leadTypeId: optionalId,
    dailyTask: z.boolean().optional().default(false),
    // Values of fields added in Edit Page Layout, keyed by field key. Validated against the layout when saved.
    customFields: z.record(z.string().max(64), z.union([z.string().max(5000), z.number(), z.boolean(), z.null()])).optional().default({}),
  })
  .strict();
export type LeadInput = z.infer<typeof leadInputSchema>;

export const notesSchema = z.object({ notes: optionalText(5000) }).strict();

export const attachmentSignSchema = z
  .object({
    files: z
      .array(
        z
          .object({
            name: z.string().trim().min(1).max(255),
            type: z.string().trim().max(100),
            size: z.number().int().positive().max(MAX_ATTACHMENT_BYTES, "File is larger than 10 MB"),
          })
          .strict()
          .refine(f => f.type in ALLOWED_ATTACHMENT_TYPES, "File type not allowed (JPEG, PNG, WebP or PDF only)")
      )
      .min(1)
      .max(MAX_ATTACHMENTS_PER_LEAD),
  })
  .strict();

export const attachmentCompleteSchema = z.object({ ids: z.array(z.string().min(1).max(64)).min(1).max(MAX_ATTACHMENTS_PER_LEAD) }).strict();
