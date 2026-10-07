// What the Projects page can be sorted, filtered and dated by. Shared by the server (list.ts) and the browser; no server-only imports.

export const PROJECT_PAGE_SIZE = 50;
export const PROJECT_SORT_KEYS = ["code", "name", "location", "start", "validity", "prior", "progress", "status"] as const;
export type ProjectSortKey = (typeof PROJECT_SORT_KEYS)[number];

// Which date the calendar's From / To range applies to (the funnel icon); the first one is used when nothing else is picked
export const PROJECT_DATE_TYPES = [
  { value: "start", label: "Project Start Date" },
  { value: "validity", label: "Project Validity" },
  { value: "prior", label: "Prior Completion Date" },
  { value: "created", label: "Converted Date" },
] as const;
export type ProjectDateBy = (typeof PROJECT_DATE_TYPES)[number]["value"];

export const PROJECT_FILTER_KEYS = ["status", "taskPerson", "location"] as const;
export type ProjectFilterKey = (typeof PROJECT_FILTER_KEYS)[number];

export type ProjectListParams = {
  q?: string;
  sort?: ProjectSortKey;
  dir: "asc" | "desc";
  page: number;
  from?: string; // YYYY-MM-DD
  to?: string;
  dateBy?: ProjectDateBy;
  cols: Partial<Record<ProjectFilterKey, string[]>>; // header tick-box filters: several values in one column = OR, different columns = AND
};
