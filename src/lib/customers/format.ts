// Small pure helpers of the Customer form: phone numbers with their country code, the Display Name choices, the address as printed lines.

import { DEFAULT_PHONE_CODE, PHONE_CODES } from "./constants";

// "+919876543210" -> { code: "+91", number: "9876543210" }. A number without a plus sign is taken as a number of the default country.
const BY_LENGTH = [...PHONE_CODES].sort((a, b) => b.code.length - a.code.length);
export function splitPhone(value: unknown): { code: string; number: string } {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return { code: DEFAULT_PHONE_CODE, number: "" };
  const digits = text.replace(/\D/g, "");
  if (!text.startsWith("+")) return { code: DEFAULT_PHONE_CODE, number: digits };
  const hit = BY_LENGTH.find(c => digits.startsWith(c.code.slice(1)));
  if (!hit) return { code: DEFAULT_PHONE_CODE, number: digits };
  return { code: hit.code, number: digits.slice(hit.code.length - 1) };
}

// A number without a country code is an Indian one: 9876543210, 09876543210 and 919876543210 all become +919876543210. Anything else is left as typed.
export function withCountryCode(phone: string): string {
  if (phone.startsWith("+")) return phone;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+${DEFAULT_PHONE_CODE.slice(1)}${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `+${DEFAULT_PHONE_CODE.slice(1)}${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith(DEFAULT_PHONE_CODE.slice(1))) return `+${digits}`;
  return phone;
}

// ("+91", "98765 43210") -> "+919876543210"; no digits -> ""
export function joinPhone(code: string, number: string): string {
  const digits = number.replace(/\D/g, "");
  return digits ? `${code}${digits}` : "";
}

// The choices of Display Name: the first name, the last name, the company, and the first and last name together
export function displayNameChoices(p: { firstName?: unknown; lastName?: unknown; companyName?: unknown; salutation?: unknown }): string[] {
  const t = (v: unknown) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "");
  const first = t(p.firstName);
  const last = t(p.lastName);
  const company = t(p.companyName);
  const both = [first, last].filter(Boolean).join(" ");
  const out = [both && first && last ? both : "", company, first, last].filter(Boolean);
  return Array.from(new Set(out));
}

export type AddressParts = {
  attention?: string | null; street1?: string | null; street2?: string | null; city?: string | null; state?: string | null;
  pinCode?: string | null; country?: string | null;
};

// The lines of an address as they are printed on a quote:  Attention / Street 1 / Street 2 / City, State Pin / Country
export function addressLines(a: AddressParts): string[] {
  const t = (v: string | null | undefined) => (v ?? "").trim();
  const place = [t(a.city), t(a.state)].filter(Boolean).join(", ");
  const cityLine = [place, t(a.pinCode)].filter(Boolean).join(" ");
  return [t(a.attention), t(a.street1), t(a.street2), cityLine, t(a.country)].filter(Boolean);
}

// The letter in the round avatar of a customer in the list: the first character of the name, whatever it is (". ARCHANA" shows ".")
export const initialOf = (name: string) => (name.trim()[0] ?? "?").toUpperCase();
