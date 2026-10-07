// GST rules of the Customer form: what each GST Treatment asks for, and checking a GSTIN. Pure functions shared by the server (which decides) and
// the browser (which shows the right fields). No GST portal is called: a GSTIN is checked by its shape, its state code and its check character.

export type GstinNeed = "required" | "optional" | "none";

export type GstTreatment = {
  id: string;
  label: string;
  hint: string; // the line shown under the option in the dropdown
  gstin: GstinNeed; // GSTIN / UIN, with Validate, and the Business Legal Name and Business Trade Name that go with it
  place: boolean; // Place of Supply is asked
  pan: boolean;
  tax: boolean; // Tax Preference is asked
};

export const GST_TREATMENTS: GstTreatment[] = [
  { id: "registered_regular", label: "Registered Business - Regular", hint: "Business that is registered under GST", gstin: "required", place: true, pan: true, tax: true },
  { id: "registered_composition", label: "Registered Business - Composition", hint: "Business that is registered under the Composition Scheme in GST", gstin: "required", place: true, pan: true, tax: true },
  { id: "unregistered", label: "Unregistered Business", hint: "Business that has not been registered under GST", gstin: "none", place: true, pan: true, tax: true },
  { id: "consumer", label: "Consumer", hint: "A customer who is a regular consumer", gstin: "none", place: true, pan: true, tax: true },
  { id: "overseas", label: "Overseas", hint: "Persons with whom you do import or export of supplies outside India", gstin: "none", place: false, pan: false, tax: true },
  { id: "sez", label: "Special Economic Zone", hint: "Business (Unit) that is located in a Special Economic Zone (SEZ) of India or a SEZ Developer", gstin: "required", place: true, pan: true, tax: true },
  { id: "deemed_export", label: "Deemed Export", hint: "Supply of goods to an Export Oriented Unit or against Advanced Authorization / Export Promotion Capital Goods", gstin: "required", place: true, pan: true, tax: true },
  { id: "tax_deductor", label: "Tax Deductor", hint: "Departments of the State / Central government, governmental agencies or local authorities", gstin: "optional", place: true, pan: true, tax: true },
  { id: "sez_developer", label: "SEZ Developer", hint: "A person / organisation who owns at least 26% of the equity in creating business units in a SEZ", gstin: "required", place: true, pan: true, tax: true },
  { id: "isd", label: "Input Service Distributor", hint: "An office of the taxable person that receives tax invoices for input services and distributes the credit", gstin: "required", place: true, pan: true, tax: true },
];

// Nothing chosen yet: GSTIN is not asked, the rest is
const NONE: Omit<GstTreatment, "id" | "label" | "hint"> = { gstin: "none", place: true, pan: true, tax: true };

export function gstRules(treatmentId: unknown): Omit<GstTreatment, "id" | "label" | "hint"> {
  const t = GST_TREATMENTS.find(x => x.id === treatmentId);
  return t ?? NONE;
}

// The fields that belong to one of the rules above, by the key of the field: when the rule says no, the field is not shown and nothing is kept in it
export const GST_DEPENDENT: Record<string, (rules: ReturnType<typeof gstRules>) => boolean> = {
  gstin: r => r.gstin !== "none",
  legalName: r => r.gstin !== "none",
  tradeName: r => r.gstin !== "none",
  placeOfSupply: r => r.place,
  pan: r => r.pan,
  taxPreference: r => r.tax,
};

// ---------------------------------------------------------------------------
// GSTIN: 2 digits of state, the 10 characters of the PAN, 1 entity number, "Z", 1 check character
// ---------------------------------------------------------------------------
const SHAPE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
export const PAN_SHAPE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const STATE_CODES = new Set(["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "26", "27", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "97", "99"]);

export function gstinCheckChar(first14: string): string {
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const product = CHARS.indexOf(first14[i]) * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(product / 36) + (product % 36);
  }
  return CHARS[(36 - (sum % 36)) % 36];
}

export type GstinResult = { ok: true; gstin: string; stateCode: string; pan: string } | { ok: false; error: string };

export function validateGstin(raw: string): GstinResult {
  const gstin = raw.replace(/\s+/g, "").toUpperCase();
  if (!gstin) return { ok: false, error: "Enter the GSTIN / UIN first." };
  if (gstin.length !== 15) return { ok: false, error: "A GSTIN has 15 characters." };
  if (!SHAPE.test(gstin)) return { ok: false, error: "This is not the shape of a GSTIN (2 digits, 5 letters, 4 digits, 1 letter, 1 digit or letter, Z, 1 digit or letter)." };
  if (!STATE_CODES.has(gstin.slice(0, 2))) return { ok: false, error: "The first two digits are not the code of a state." };
  if (gstinCheckChar(gstin.slice(0, 14)) !== gstin[14]) return { ok: false, error: "The last character does not match the rest of the GSTIN. Please check it." };
  return { ok: true, gstin, stateCode: gstin.slice(0, 2), pan: gstin.slice(2, 12) };
}
