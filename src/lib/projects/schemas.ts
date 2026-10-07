// What the Projects API accepts. .strict(): a field that is not listed is rejected, never silently applied.
import { z } from "zod";

const id = z.string().trim().min(1).max(64);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date");
// An empty box is "nothing", whatever the page sent for it
const optionalText = (max: number) => z.string().max(max).nullable().optional().transform(v => (v && v.trim() ? v.trim() : null));
const optionalDay = day.nullable().optional().or(z.literal("")).transform(v => v || null);

export const convertSchema = z.object({
  productOrService: optionalText(64),
  name: z.string().max(200).transform(v => v.trim()),
  siteLocation: optionalText(500),
  siteLocationLink: optionalText(2000),
  startDate: optionalDay,
  expectedEndDate: optionalDay,
  priorCompletionDate: optionalDay,
}).strict();

// A page sends the fields it changed, by layout field key; the server checks each one against the layout
export const valuesSchema = z.object({ values: z.record(z.string().max(64), z.unknown()) }).strict();

export const selectionSchema = z.object({
  values: z.record(z.string().max(64), z.unknown()).optional(),
  serviceVendorIds: z.array(id).max(50).optional(),
  materialVendorIds: z.array(id).max(50).optional(),
}).strict();

export const paymentSchema = z.object({ amount: z.number(), templateId: id.nullable().optional() }).strict();

export const procurementItemSchema = z.object({ quoteItemId: id.nullable() }).strict();

export const recordBodySchema = z.object({ values: z.record(z.string().max(64), z.unknown()).optional(), rows: z.record(z.string().max(64), z.unknown()).optional() }).strict();
