// Every dropdown the Super Admin can manage. Shared by the server, the admin screen and the forms.
// The option rows live in the "LeadOption" table; `key` is its `type` column.
//
// Deliberately NOT here: workflow values that code branches on (task status, deal stage, lead pipeline
// stage, project status, ...). Renaming or deleting those would break the app, so they stay fixed.

export type DropdownGroup = "CRM" | "Leads" | "Projects" | "Parks";

export type DropdownListDef = {
  key: string;
  label: string;
  group: DropdownGroup;
  description: string;
  // "text": records store the chosen label as plain text.
  // "reference": records store a link (id) to the option row.
  storage: "text" | "reference";
  multi?: boolean; // multi-select field (several values per record)
  parentKey?: string; // hierarchical list: each option belongs to an option of this list
};

export const DROPDOWN_LISTS: DropdownListDef[] = [
  // ---- CRM (values stored as text on the record) ----
  { key: "CUSTOMER_TYPE", label: "Customer Type", group: "CRM", storage: "text", description: "New customer / new lead forms and the CRM customer filter." },
  { key: "CRM_LEAD_SOURCE", label: "Lead Source (CRM)", group: "CRM", storage: "text", description: "Where a CRM lead came from." },
  { key: "PROPERTY_TYPE", label: "Property Type", group: "CRM", storage: "text", description: "Type of property on a CRM lead." },
  { key: "BUDGET_RANGE", label: "Budget Range", group: "CRM", storage: "text", description: "Customer budget on a CRM lead." },
  { key: "LEAD_PRIORITY", label: "Lead Priority", group: "CRM", storage: "text", description: "Priority of a CRM lead." },
  { key: "SERVICES", label: "Services Required", group: "CRM", storage: "text", multi: true, description: "Multi-select on a CRM lead." },
  { key: "FOLLOWUP_TYPE", label: "Follow-up Type", group: "CRM", storage: "text", description: "How a follow-up is done (call, meeting, ...)." },
  { key: "VISIT_TYPE", label: "Site Visit Type", group: "CRM", storage: "text", description: "Kind of site visit." },
  // ---- Leads page (records link to the option row) ----
  { key: "SOURCE", label: "Source", group: "Leads", storage: "reference", description: "Lead & Quote Management → Source." },
  { key: "MODE_OF_CUSTOMER", label: "Mode of Customer", group: "Leads", storage: "reference", description: "How the customer reached you." },
  { key: "PRODUCT_OR_SERVICE", label: "Product / Service", group: "Leads", storage: "reference", description: "Product or service on a lead." },
  { key: "REQUIREMENT", label: "Requirement", group: "Leads", storage: "reference", description: "What the customer needs." },
  { key: "MAIN_CATEGORY", label: "Main Category", group: "Leads", storage: "reference", description: "Top level of the category tree." },
  { key: "CATEGORY", label: "Category", group: "Leads", storage: "reference", parentKey: "MAIN_CATEGORY", description: "Second level; belongs to a Main Category." },
  { key: "SUBCATEGORY", label: "Subcategory", group: "Leads", storage: "reference", parentKey: "CATEGORY", description: "Third level; belongs to a Category." },
  { key: "LEAD_STATUS", label: "Lead Status", group: "Leads", storage: "reference", description: "Status shown on the Leads page." },
  { key: "LEAD_TYPE", label: "Lead Type", group: "Leads", storage: "reference", description: "Type of lead." },
  // ---- Projects / Parks (values stored as text) ----
  { key: "PROJECT_TYPE", label: "Project Type", group: "Projects", storage: "text", description: "Type of project." },
  { key: "LANDSCAPE_TYPE", label: "Landscape Type", group: "Parks", storage: "text", description: "Type of landscape / park." },
  { key: "MAINTENANCE_TYPE", label: "Maintenance Type", group: "Parks", storage: "text", description: "Kind of landscape maintenance." },
];

export const DROPDOWN_GROUPS: DropdownGroup[] = ["CRM", "Leads", "Projects", "Parks"];

export function getListDef(key: string) {
  return DROPDOWN_LISTS.find(l => l.key === key);
}

export type DropdownOptionDto = {
  id: string;
  label: string;
  parentId: string | null;
  isDefault: boolean;
  sortOrder: number;
  usage?: number; // number of existing records using this option (admin screen only)
};

export const LABEL_MAX = 100;
