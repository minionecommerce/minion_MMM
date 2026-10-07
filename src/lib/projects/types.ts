// What the Projects pages and API exchange. No server-only imports: the browser uses these types too.

import type { FieldOption, FileDto } from "@/lib/records/types";
import type { FinancialsOut } from "./calc";

// What the signed-in person may do on a project page (the API checks again on every request)
export type ProjectAbilities = {
  edit: boolean; // projects.edit: change the project and its templates
  create: boolean; // projects.create: convert a deal
  export: boolean;
  layout: boolean; // Edit Page Layout (Super Admin)
  pprView: boolean; // Pre-Payment Records: see the Site Expenses, make a payment to a vendor
  pprCreate: boolean;
  pcrView: boolean; // Payment Collection Records
  pcrCreate: boolean;
  tasksView: boolean;
  tasksCreate: boolean;
};

// One row of a template table.
//   values  what people type or choose, by layout field key (the standard columns and the fields added in Edit Page Layout; a File Upload field is a FileDto[])
//   calc    what is worked out, by the key of the CALC field it fills
//   meta    what the screen needs to act on the row (ids, links, flags)
export type ProjectRow = { id: string; values: Record<string, unknown>; calc: Record<string, unknown>; meta: Record<string, unknown> };

export type VendorName = { code: string; name: string };

export type ProjectDetail = {
  id: string;
  code: string; // MP1
  dealId: string;
  dealNumber: string; // DL36
  dealName: string;
  customerName: string;
  // the Project Information fields and the typed ones of the Financial Summary (Exclusions, Incentive %), by layout field key; dates are YYYY-MM-DD
  values: Record<string, unknown>;
  money: FinancialsOut;
  valueInfo: { rows: ProjectRow[]; total: number }; // an accepted quote per row; the total is the Project Value
  selection: { groups: { quoteId: string; quoteNumber: string; rows: ProjectRow[] }[] }; // the items of each accepted quote
  workCoverage: ProjectRow[];
  materialVendors: ProjectRow[];
  serviceVendors: ProjectRow[];
  payments: { rows: ProjectRow[]; total: number } | null; // null: the person may not see Payment Collection Records
  expenses: { rows: ProjectRow[]; total: number } | null; // null: the person may not see Pre-Payment Records
  tasks: ProjectRow[] | null; // null: the person may not see tasks
  procurement: { blocks: { id: string; quoteItemId: string | null; itemLabel: string | null; rows: ProjectRow[] }[]; itemChoices: { id: string; label: string }[] };
  templates: FieldOption[]; // the Template dropdown's choices
  refs: {
    users: Record<string, string>;
    serviceVendors: Record<string, VendorName>;
    materialVendors: Record<string, VendorName>;
    templates: Record<string, string>;
    // the records a Lookup field added in Edit Page Layout points to
    deals: Record<string, { code: string; name: string; customer: string | null; closed: boolean; projectId?: string | null }>;
    lookups: Record<string, Record<string, string>>;
  };
  abilities: ProjectAbilities;
  updatedAt: string;
};

export type ProjectListRow = {
  id: string;
  code: string;
  dealId: string | null;
  dealNumber: string;
  name: string;
  siteLocation: string | null;
  siteLocationLink: string | null;
  taskPerson: string | null; // the Task Person of the deal
  contact: { customerName: string; contactNumber: string; leadTypeLabel: string | null };
  projectValue: number;
  collected: number;
  balance: number;
  startDate: string | null; // YYYY-MM-DD
  actualStartDate: string | null;
  expectedEndDate: string | null; // Project Validity
  completedDate: string | null;
  priorCompletionDate: string | null;
  progress: number;
  statusLabel: string;
  custom: Record<string, string>; // the fields added in the Project section of Edit Page Layout that are list columns: key -> text
};

export type ProjectListData = {
  rows: ProjectListRow[];
  total: number; // all projects
  showing: number; // the ones that match the search and filters
  totalValue: number; // Total Value of the projects that match
  page: number;
  pageCount: number;
  pageSize: number;
};

export type VendorPayment = {
  id: string;
  code: string;
  date: string | null;
  amount: number;
  status: string;
  remarks: string;
  counted: boolean; // false: rejected or cancelled, not part of the Given Amount
};

export type ConvertInput = {
  productOrService: string | null;
  name: string;
  siteLocation: string | null;
  siteLocationLink: string | null;
  startDate: string | null;
  expectedEndDate: string | null;
  priorCompletionDate: string | null;
};

export type { FileDto };
