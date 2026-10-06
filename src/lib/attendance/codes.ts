// Site Visit Codes offered by the Site In / Office Out popups.
// PLACEHOLDER for this phase: a fixed list. The real codes will come from the Site Visit system in a later phase;
// when that arrives only listSiteVisitCodes() changes (the popups and the server check both go through it).

import type { SiteVisitCodeOption } from "./types";

const SAMPLE_CODES: { code: string; name: string }[] = [
  { code: "SV001", name: "Skyline Project" },
  { code: "SV002", name: "Prestige Apartment" },
  { code: "SV003", name: "Green Valley Villa" },
  { code: "SV004", name: "Lakeview Residency" },
  { code: "SV005", name: "Orchid Tech Park" },
];

export function listSiteVisitCodes(): SiteVisitCodeOption[] {
  return SAMPLE_CODES.map(c => ({ ...c, label: `${c.code} - ${c.name}` }));
}
