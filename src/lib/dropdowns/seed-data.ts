// The values the forms used before dropdowns became editable, so nothing changes until the Super Admin edits a list.
export const DROPDOWN_SEED: { key: string; defaultLabel?: string; labels: string[] }[] = [
  { key: "CUSTOMER_TYPE", defaultLabel: "Individual", labels: ["Individual", "Company", "Builder", "Architect", "Interior Designer", "Contractor"] },
  { key: "CRM_LEAD_SOURCE", defaultLabel: "Website", labels: ["Website", "Referral", "Walk-in", "Social Media", "Exhibition", "Cold Call", "Google Ads"] },
  { key: "PROPERTY_TYPE", labels: ["Villa", "Apartment", "Independent House", "Office", "Restaurant", "Commercial", "Builder Project"] },
  { key: "BUDGET_RANGE", labels: ["₹0–2L", "₹2–4L", "₹4–6L", "₹6–8L", "₹8–10L", "₹10–15L", "₹15L+"] },
  { key: "LEAD_PRIORITY", defaultLabel: "Medium", labels: ["Low", "Medium", "High"] },
  { key: "SERVICES", labels: ["Home Automation", "Interior Design", "Landscaping", "Security", "Garden Automation", "False Ceiling", "Plumbing", "Electrical"] },
  { key: "FOLLOWUP_TYPE", defaultLabel: "Call", labels: ["Call", "WhatsApp", "Email", "Meeting", "Site Visit"] },
  { key: "VISIT_TYPE", defaultLabel: "Initial", labels: ["Initial", "Follow-up", "Measurement", "Final"] },
  { key: "PROJECT_TYPE", labels: ["Smart Home Automation", "Interior Design", "Landscaping", "Home Automation + Interiors", "Interior + Landscaping", "Complete Turnkey", "Commercial Interior", "Restaurant / Cafe", "Office", "Villa", "Apartment", "Builder Project", "Other"] },
  { key: "LANDSCAPE_TYPE", defaultLabel: "Residential Garden", labels: ["Residential Garden", "Villa Landscape", "Terrace Garden", "Apartment Landscape", "Corporate Landscape", "Commercial Landscape", "Public Park", "Vertical Garden", "Outdoor Space", "Maintenance Contract", "Other"] },
  { key: "MAINTENANCE_TYPE", labels: ["Watering", "Pruning", "Fertilizing", "Grass Cutting", "Pest Control", "Plant Replacement", "Cleaning", "Irrigation Service", "Lighting Service", "Pergola Maintenance", "General Maintenance"] },
];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

export const DROPDOWN_SEED_ROWS = DROPDOWN_SEED.flatMap(list =>
  list.labels.map((label, i) => ({
    id: `dd_${list.key.toLowerCase()}_${slug(label) || i}`,
    type: list.key,
    label,
    sortOrder: i,
    isDefault: list.defaultLabel === label,
  })),
);
