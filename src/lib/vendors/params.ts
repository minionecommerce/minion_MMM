// The unified Vendors list (Material and Service Vendors in one table). No server-only imports: the page and the browser share these.
export const VENDOR_PAGE_SIZE = 50;
export const VENDOR_KINDS = [
  { id: "material", label: "Material" },
  { id: "service", label: "Service" },
] as const;
export type VendorKindId = (typeof VENDOR_KINDS)[number]["id"];
export const VENDOR_SORTS = ["code", "type", "name", "city", "created"] as const;
export type VendorSort = (typeof VENDOR_SORTS)[number];

export type VendorListParams = { q?: string; types: VendorKindId[]; sort?: VendorSort; dir: "asc" | "desc"; page: number };

export type VendorRow = {
  id: string;
  kind: VendorKindId;
  code: string;
  name: string;
  phone: string | null;
  city: string | null;
  subtype: string | null; // Dealer, Contractor ... (the vendor's own business type)
  person: string | null; // Task Person
  created: string; // ISO
};
export type VendorListData = { rows: VendorRow[]; total: number; showing: number; page: number; pageCount: number; pageSize: number };

// The page of one vendor: each kind keeps its own full form (price details, remarks ...)
export const vendorHref = (kind: VendorKindId, id: string, suffix = "") => `/${kind === "material" ? "material-vendors" : "service-vendors"}/${id}${suffix}`;
export const vendorApi = (kind: VendorKindId, id: string) => `/api/records/${kind === "material" ? "material-vendors" : "service-vendors"}/${id}`;

export function parseVendorParams(raw: Record<string, string | string[] | undefined>): VendorListParams {
  const one = (k: string) => (Array.isArray(raw[k]) ? (raw[k] as string[])[0] : (raw[k] as string | undefined));
  const sort = one("sort");
  const types = (one("type") ?? "").split(",").filter((t): t is VendorKindId => VENDOR_KINDS.some(k => k.id === t));
  return {
    q: one("q")?.trim().slice(0, 100) || undefined,
    types: Array.from(new Set(types)),
    sort: (VENDOR_SORTS as readonly string[]).includes(sort ?? "") ? (sort as VendorSort) : undefined,
    dir: one("dir") === "asc" ? "asc" : "desc",
    page: Math.max(1, Number(one("page")) || 1),
  };
}
