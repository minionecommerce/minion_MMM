import { prisma } from "@/lib/db";
import type { AuthContext } from "@/lib/auth";
import { ServiceError } from "@/lib/users/service";
import { DEAL_CLOSING_MAX_YEARS, DEAL_NUMBER_PREFIX } from "@/lib/leads/constants";
import { normalizePhone, todayDay } from "@/lib/leads/format";
import { checkLeadAgainstLayout } from "@/lib/leads/layout";
import type { DealInput, LeadInput } from "@/lib/leads/schemas";
import {
  audit, badRequest, changesOf, dealNumberFor, findOrCreateCustomer, leadCodeFor, leadData, leadDetail, need, nextDealSeq, nextLeadSeq, notFound, resolveReferences, TX,
} from "@/lib/leads/service";

// ---------------------------------------------------------------------------
// Deals page actions. A deal is read and changed through the lead it was made from (Deal.leadId): the customer, requirements, staff,
// follow-ups, files and the closed state all live on that lead, which the Leads page no longer shows. Anything that is the deal's own
// (Deal Name, Deal Value, Deal Validity, Deal Status, the DL number) lives on the Deal.
// ---------------------------------------------------------------------------

// The live deal behind a Deals page action, with the id of its lead. A deal that became a project (Convert to Project) stays in the CRM
// but is closed to changes: it can be looked at (allowConverted), nothing more. Its project is where the work goes on.
export async function findDeal(dealId: string, options: { allowConverted?: boolean } = {}) {
  const deal = await prisma.deal.findFirst({
    where: { id: dealId, dealNumber: { startsWith: DEAL_NUMBER_PREFIX }, deletedAt: null, lead: { deletedAt: null, convertedAt: { not: null } } },
    select: { id: true, leadId: true, dealNumber: true, title: true, value: true, expectedCloseDate: true, dealStatusId: true, projectConvertedAt: true, projects: { where: { deletedAt: null }, select: { projectCode: true }, take: 1 } },
  });
  if (!deal) throw notFound("deal");
  if (deal.projectConvertedAt && !options.allowConverted) {
    const code = deal.projects[0]?.projectCode;
    throw new ServiceError(409, `Deal ${deal.dealNumber} was converted to a project${code ? ` (${code})` : ""}. It is kept as it was and can no longer be changed or deleted.`);
  }
  return deal;
}

// The id of the lead behind a deal, for the actions that are done on the lead itself (notes, follow-ups, files, closing, ...).
// The permission is checked first, so a person without it cannot tell whether a deal exists.
// A deal that became a project is only opened by the routes that just read it (allowConverted); every route that adds or changes
// something refuses it, whatever permission it asks for.
export async function leadIdOf(actor: AuthContext, dealId: string, action: "view" | "create" | "edit" | "delete", options: { allowConverted?: boolean } = {}) {
  need(actor, action, "deal");
  return (await findDeal(dealId, options)).leadId;
}

// The View dialog of a deal: the deal's own details and the original lead's, with its files and follow-ups.
// Needs deals.view only; the lead's details come along because they were carried forward with the deal.
export async function getDealDetail(actor: AuthContext, dealId: string) {
  need(actor, "view", "deal");
  const deal = await findDeal(dealId, { allowConverted: true });
  return leadDetail(deal.leadId);
}

const dayOf = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

// A Closing Date is today or later (an unchanged one may have passed since the deal was made) and not absurdly far away
function checkClosingDate(closingDate: string, unchangedFrom: string | null) {
  const today = todayDay();
  if (closingDate !== unchangedFrom && closingDate < today) throw badRequest("Closing Date cannot be in the past");
  const latest = new Date(`${today}T00:00:00Z`);
  latest.setUTCFullYear(latest.getUTCFullYear() + DEAL_CLOSING_MAX_YEARS);
  if (closingDate > latest.toISOString().slice(0, 10)) throw badRequest(`Closing Date must be within ${DEAL_CLOSING_MAX_YEARS} years`);
}

// Edit Deal: the same form as Edit Lead (it changes the lead behind the deal) plus the deal's own Deal Name, Closing Date, Deal Value and Deal Status
export async function updateDeal(actor: AuthContext, dealId: string, input: DealInput) {
  need(actor, "edit", "deal");
  const deal = await findDeal(dealId);
  const before = await prisma.lead.findFirst({ where: { id: deal.leadId, deletedAt: null } });
  if (!before) throw notFound("deal");

  const { dealName, closingDate, dealValue, dealStatusId, ...fields } = input;
  const leadInput: LeadInput = { ...fields, leadStatusId: null, amount: null }; // a deal has a Deal Status, and its Amount is the Deal Value
  const custom = await checkLeadAgainstLayout(leadInput, { skip: ["leadStatusId", "amount"] });
  const refs = await resolveReferences(leadInput);
  const phone = normalizePhone(leadInput.contactNumber)!;

  checkClosingDate(closingDate, dayOf(deal.expectedCloseDate));
  const value = Math.round(dealValue * 100) / 100;
  if (value <= 0) throw badRequest("Deal Value must be more than 0");
  if (dealStatusId && !(await prisma.leadOption.findFirst({ where: { id: dealStatusId, type: "DEAL_STATUS" }, select: { id: true } }))) throw badRequest("Deal Status is not valid");

  const data = leadData(leadInput, refs, actor, phone, custom, "deal");
  await prisma.$transaction(async tx => {
    const customerId = phone !== before.contactNumber ? await findOrCreateCustomer(tx, leadInput.customerName, phone) : undefined;
    const changes = changesOf(before, data);
    await tx.lead.update({ where: { id: before.id }, data: { ...data, ...(customerId ? { customerId } : {}), updatedById: actor.userId } });

    const dealChanges = changesOf(
      { dealName: deal.title, dealValue: Number(deal.value), closingDate: dayOf(deal.expectedCloseDate), dealStatusId: deal.dealStatusId },
      { dealName, dealValue: value, closingDate, dealStatusId: dealStatusId ?? null },
    );
    await tx.deal.update({
      where: { id: deal.id },
      data: {
        title: dealName,
        value,
        expectedCloseDate: new Date(`${closingDate}T00:00:00.000Z`),
        dealStatusId: dealStatusId ?? null,
        salesExecutiveId: leadInput.taskAssignedPersonId, // the older CRM keeps the Task Assigned Person on the deal as well
        ...(customerId ? { customerId } : {}),
      },
    });
    await audit(tx, actor, before.id, "Updated", { ...changes.from, ...dealChanges.from }, { ...changes.to, ...dealChanges.to }, deal.id);
  }, TX);
  return { number: deal.dealNumber };
}

// Soft delete: the deal and the lead behind it leave every list; their numbers are never reused
export async function deleteDeal(actor: AuthContext, dealId: string) {
  need(actor, "delete", "deal");
  const deal = await findDeal(dealId);
  const now = new Date();
  await prisma.$transaction(async tx => {
    await tx.deal.update({ where: { id: deal.id }, data: { deletedAt: now } });
    await tx.lead.update({ where: { id: deal.leadId }, data: { deletedAt: now, updatedById: actor.userId } });
    await audit(tx, actor, deal.leadId, "Deleted", { dealNumber: deal.dealNumber, dealName: deal.title }, undefined, deal.id);
  }, TX);
}

// A copy of the deal with a new Deal ID. Like Duplicate Lead it also makes a new lead (new Lead ID) for the copy, because follow-ups,
// files and the closed state belong to that lead and the copy has to start fresh. Files and follow-ups are not copied.
export async function duplicateDeal(actor: AuthContext, dealId: string) {
  need(actor, "create", "deal");
  const deal = await findDeal(dealId);
  const src = await prisma.lead.findFirst({ where: { id: deal.leadId, deletedAt: null } });
  if (!src) throw notFound("deal");
  if (!src.customerName || !src.contactNumber) throw badRequest("This deal is missing required details. Edit it first, then duplicate.");
  const input: LeadInput = {
    customerName: src.customerName,
    contactNumber: src.contactNumber,
    taskAssignedPersonId: src.salesExecutiveId,
    productOrServiceId: src.productOrServiceId,
    requirementId: src.requirementId,
    exactRequirement: src.exactRequirement,
    modeOfCustomerId: src.modeOfCustomerId,
    sourceId: src.sourceId,
    location: src.location,
    exactLocation: src.exactLocation,
    locationLink: src.locationLink,
    mainCategoryId: src.mainCategoryId,
    subcategoryId: src.subcategoryId,
    leadPersonId: src.leadPersonId,
    leadStatusId: src.leadStatusId,
    amount: src.amount !== null ? Number(src.amount) : null,
    conventionalRate: src.conventionalRate !== null ? Number(src.conventionalRate) : null,
    notes: src.notes,
    leadTypeId: src.leadTypeId,
    dailyTask: src.dailyTask,
    customFields: (src.customFields ?? {}) as Record<string, string | number | boolean | null>,
  };
  const custom = await checkLeadAgainstLayout(input, { skip: ["leadStatusId", "amount"] });
  const refs = await resolveReferences(input);
  const phone = normalizePhone(input.contactNumber)!;

  return prisma.$transaction(async tx => {
    const now = new Date();
    const customerId = await findOrCreateCustomer(tx, input.customerName, phone);
    // Take the numbers last, so the counter rows are locked for as short a time as possible
    const seq = await nextLeadSeq(tx);
    const leadCode = leadCodeFor(seq);
    const lead = await tx.lead.create({
      data: {
        ...leadData(input, refs, actor, phone, custom),
        customerId,
        leadSeq: seq,
        leadCode,
        leadNumber: leadCode,
        status: "New",
        createdById: actor.userId,
        updatedById: actor.userId,
        convertedAt: now, // the copy is a deal from the start: it is not an active lead
      },
      select: { id: true },
    });
    const dealNumber = dealNumberFor(await nextDealSeq(tx));
    const copy = await tx.deal.create({
      data: {
        dealNumber,
        leadId: lead.id,
        customerId,
        title: deal.title,
        value: deal.value,
        expectedCloseDate: deal.expectedCloseDate,
        dealStatusId: deal.dealStatusId,
        salesExecutiveId: input.taskAssignedPersonId,
        createdAt: now,
      },
      select: { id: true },
    });
    await audit(tx, actor, lead.id, "Duplicated", undefined, { from: deal.dealNumber, dealNumber, leadCode }, copy.id);
    return { dealId: copy.id, dealNumber, leadCode };
  }, TX);
}
