// What the Customer form and the API exchange. No server-only imports: the browser uses these types too.

import type { LookupItem, ModuleLayoutDto } from "@/lib/records/types";
// What the signed-in person may do (the API checks again on every request)
export type CustomerAbilities = { create: boolean; edit: boolean; layout: boolean };

// One customer as the form shows it: the value of every field of the layout by its key (a File Upload field holds FileDto[])
export type CustomerRecord = {
  id: string;
  code: string | null;
  values: Record<string, unknown>;
  updatedAt: string;
};

// Everything the form window needs in one answer: the layout, the customer being edited (none for a new one), the people for a User field, the
// number the next customer will get, and what the person may do
export type CustomerFormData = {
  layout: ModuleLayoutDto;
  record: CustomerRecord | null;
  users: LookupItem[];
  nextCode: string;
  abilities: CustomerAbilities;
};
