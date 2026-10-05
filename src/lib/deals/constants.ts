import type { LeadFilterId } from "@/lib/leads/constants";

// Deals page: what its table can be sorted by (the Leads page's keys, with the deal's own Deal ID and Deal Validity)
export const DEAL_SORT_KEYS = ["deal", "customer", "requirement", "assigned", "status", "source", "category", "location", "validity"] as const;
export type DealSortKey = (typeof DEAL_SORT_KEYS)[number];

// Quick filter buttons: the Leads page's, named for deals. They use the same ids and the same Status rules (Open / Follow-up / Closed);
// there is no Pending button.
export const DEAL_FILTERS: { id: LeadFilterId; label: string }[] = [
  { id: "open", label: "Open Deal" },
  { id: "follow_up", label: "Follow-up Deal" },
  { id: "revive", label: "Revive Deal" },
  { id: "today_followup", label: "Today Follow-up" },
];

// Which date the calendar's From / To range applies to, chosen with the funnel icon. Deal Created Date is the default.
export const DEAL_DATE_FILTER_TYPES = [
  { value: "created", label: "Deal Created Date" },
  { value: "validity", label: "Deal Validity" },
  { value: "last", label: "Follow Up Last Date" },
  { value: "next", label: "Follow Up Next Date" },
] as const;
