// Starter values for the Leads dropdowns. They live in the LeadOption table, so they can be
// edited later without code changes. Replace the examples with your real lists.
import type { OptionType } from "./constants";

export type SeedOption = { id: string; type: OptionType; key?: string; label: string; parentId?: string };

const flat = (type: OptionType, prefix: string, labels: string[], keys: Record<string, string> = {}): SeedOption[] =>
  labels.map((label) => ({ id: `lo_${prefix}_${label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`, type, label, key: keys[label] }));

export const SEED_OPTIONS: SeedOption[] = [
  ...flat("SOURCE", "source", ["Website", "Google", "Instagram", "Facebook", "Indiamart", "Reference", "Direct", "Phone", "WhatsApp", "Other"]),
  ...flat("PRODUCT_OR_SERVICE", "pos", ["Product", "Service"]),
  ...flat("MODE_OF_CUSTOMER", "mode", ["Walk-in", "Phone Call", "Online Enquiry", "Reference", "Existing Customer"]),
  ...flat("REQUIREMENT", "req", ["Water Level Controller"]),
  ...flat("LEAD_STATUS", "status", ["Open", "Follow-up", "Revive", "Pending", "Work Given To Opponent"], {
    Open: "open", "Follow-up": "follow_up", Revive: "revive", Pending: "pending", "Work Given To Opponent": "work_given_to_opponent",
  }),
  ...flat("LEAD_TYPE", "type", ["Standard"]),
  // Main Category -> Category -> Subcategory
  { id: "lo_main_automation", type: "MAIN_CATEGORY", label: "Automation Solutions" },
  { id: "lo_cat_integration", type: "CATEGORY", label: "Integration, Control & Voice", parentId: "lo_main_automation" },
  { id: "lo_sub_touch_panels", type: "SUBCATEGORY", label: "Touch Panels & Touch Switches", parentId: "lo_cat_integration" },
  { id: "lo_sub_water_controller", type: "SUBCATEGORY", label: "Water Controller", parentId: "lo_cat_integration" },
];
