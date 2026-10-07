// Words of an item name and of a code description, made comparable: lower case, one spelling, plural and -ing / -er endings taken off, noise left out.
// Pure (no server imports): the matcher and its tests use it.

// Spellings that differ between a name typed by a person and the official wording
const SPELLING: Record<string, string> = {
  aluminum: "aluminium", color: "colour", colored: "coloured", fiber: "fibre", fibers: "fibres", center: "centre", tire: "tyre", tires: "tyres", sulfur: "sulphur",
  stabilizer: "stabiliser", stabilizers: "stabilisers", gray: "grey", jewelry: "jewellery", tv: "television", tvs: "television", wifi: "wireless", "wi-fi": "wireless",
  mobiles: "mobile", cellphone: "mobile", cellphones: "mobile", smartphones: "smartphone", laptops: "laptop", cctv: "cctv", utensils: "utensil",
};

// Words that say nothing about what the thing is (in a name or in a description)
const NOISE = new Set([
  "a", "an", "the", "of", "for", "and", "or", "with", "without", "in", "on", "to", "by", "from", "at", "as", "is", "are", "be", "per", "into", "than", "that", "this", "its", "it",
  "new", "old", "set", "kit", "pack", "packs", "pcs", "pc", "piece", "pieces", "nos", "no", "number", "model", "type", "size", "sized", "small", "medium", "large", "big", "mini",
  "premium", "standard", "basic", "heavy", "duty", "brand", "branded", "original", "combo", "pair", "unit", "units", "item", "items", "product", "products", "quality", "best", "good",
  "other", "others", "parts", "part", "thereof", "whether", "not", "including", "included", "elsewhere", "specified", "kind", "kinds", "used", "use", "uses", "similar", "excluding",
  "heading", "headings", "subheading", "n.e.s", "nes", "nec", "like", "such", "example", "examples", "designed", "suitable", "solely", "principally", "capable", "having", "being",
  "made", "making", "made-up", "up", "any", "all", "other", "than", "exceeding", "exceed", "less", "more", "only", "also", "which", "their", "these", "those", "one", "two", "three",
  "work", "works", "service", "services", "charge", "charges", "cost", "fee", "fees", "rate", "price", "extra", "additional", "supply", "supplies", "supplier",
]);
// the words above that DO tell a service from goods are only noise for goods names; the service words are kept for the SAC side (see tokensOf)
const SERVICE_KEEP = new Set(["work", "works", "service", "services", "charge", "charges", "supply"]);

export function stemWord(word: string): string {
  let s = word;
  if (s.length <= 3 || /\d/.test(s)) return s;
  if (s.endsWith("ies") && s.length > 4) s = `${s.slice(0, -3)}y`;
  else if (/(ches|shes|sses|xes|zes)$/.test(s)) s = s.slice(0, -2);
  else if (s.endsWith("s") && !/(ss|us|is)$/.test(s)) s = s.slice(0, -1);
  for (const suffix of ["ing", "ed", "er"]) {
    if (s.endsWith(suffix) && s.length - suffix.length >= 4) { s = s.slice(0, -suffix.length); break; }
  }
  if (/([b-df-hj-np-tv-z])\1$/.test(s) && !s.endsWith("ss")) s = s.slice(0, -1); // controll → control, scann → scan
  return s; // a final "e" stays: it keeps "pole" and "polling" (poll → pol) apart
}

// A word right after a number tells the size or the count, not what the thing is: "8 channel" DVR, "4 core" cable, "5 pin" socket, "1 inch" pipe, "3 phase" motor
const AFTER_NUMBER = new Set([
  "channel", "channels", "core", "cores", "pin", "pins", "port", "ports", "way", "ways", "gang", "gangs", "phase", "pole", "poles", "inch", "inches", "feet", "foot", "ft", "mm", "cm",
  "meter", "meters", "metre", "metres", "kg", "gram", "grams", "ltr", "litre", "litres", "liter", "liters", "watt", "watts", "volt", "volts", "amp", "amps", "ampere", "amperes",
  "ton", "tons", "tonne", "hp", "kw", "kva", "mp", "megapixel", "gb", "tb", "mbps", "pcs", "nos", "bhk", "seater", "seat", "burner", "burners", "star", "ply", "layer", "layers", "tier", "tiers",
  "door", "doors", "drawer", "drawers", "shelf", "shelves", "step", "steps", "bar", "inches", "sqft", "sqm", "rft", "years", "year", "months", "month", "days", "day", "hours", "hour",
]);

// Names that start with a number but say what the thing is
const KEEP_WITH_NUMBER = new Set(["2d", "3d", "4d", "5d", "3g", "4g", "5g", "4k", "8k", "360"]);

// A name that is no name at all (a placeholder typed while testing, "Item 1", "Misc"): nothing is suggested for it
const PLACEHOLDER = /^(test|testing|demo|dummy|sample|trial|abc|xyz|na|nil|tbd|item|items|misc|miscellaneous|general|other|others|material|materials|product|products|goods|new item|new|service|services|charge|charges|work|works|labour|labor)( ?\d+)?$/;

// The comparable words of a text, and how many words it had in all (the words that were left out make a table name a little less exact than one that lost nothing).
// `service` keeps words such as "work" and "service" (they are what a service name is made of); for goods they are noise.
export function analyse(text: string, service = false): { tokens: string[]; words: number } {
  const words = text
    .toLowerCase()
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/\bwi[\s-]?fi\b/g, "wifi")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean);
  if (PLACEHOLDER.test(words.join(" "))) return { tokens: [], words: words.length };
  const tokens: string[] = [];
  let afterNumber = false;
  for (const raw of words) {
    const w = SPELLING[raw] ?? raw;
    const isNumber = /^\d+$/.test(w);
    const follows = afterNumber;
    afterNumber = isNumber;
    if (/^\d+[a-z]{0,3}$/.test(w) && w.length <= 6 && !KEEP_WITH_NUMBER.has(w)) continue; // 12v, 5mm, 100w, 2: sizes and counts are not what the thing is
    if (follows && AFTER_NUMBER.has(w)) continue;
    if (NOISE.has(w) && !(service && SERVICE_KEEP.has(w))) continue;
    if (w.length < 2) continue;
    tokens.push(stemWord(w));
  }
  return { tokens, words: words.length };
}

export const tokensOf = (text: string, service = false): string[] => analyse(text, service).tokens;

export const uniqueTokens = (tokens: string[]): string[] => Array.from(new Set(tokens));
