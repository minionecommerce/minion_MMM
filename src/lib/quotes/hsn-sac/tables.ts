// The code tables behind "the code is filled in from the item name": every HSN code (Goods) and SAC (Service) with what it covers and the names people give
// such an item. The tables are plain text, one line per code (see the files next to this one); this reads them once into entries the matcher can score.
// Pure: no server imports, so the tests load it as it is.

import type { ItemKind } from "../item-constants";
import { GOODS_BUILDING } from "./goods-building";
import { GOODS_ELECTRICAL } from "./goods-electrical";
import { GOODS_GENERAL } from "./goods-general";
import { GOODS_MACHINERY } from "./goods-machinery";
import { SERVICES } from "./services";

export type CodeEntry = {
  code: string; // 4 digits (a heading) or 6 digits (a sub-heading, a SAC)
  description: string; // what the code covers, in the words of the tariff
  kind: ItemKind;
  names: string[]; // what an item of this code is called on a quote
};

// The order is the tie-break: where two codes fit a name equally well, the one that comes first wins. The tables of the work this business does come first.
export const GOODS_TABLES = [GOODS_ELECTRICAL, GOODS_BUILDING, GOODS_GENERAL, GOODS_MACHINERY];
export const SERVICE_TABLES = [SERVICES];

const MAX_NAMES = 90; // a code with more names than this is padded; the rest are not read
const squash = (s: string) => s.replace(/\s+/g, " ").trim();

// "code|description|name; another name; ..." one per line; a line that starts with # is a comment. A line that cannot be read is skipped (the tests list them).
export function parseTable(text: string, kind: ItemKind): CodeEntry[] {
  const out: CodeEntry[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const [codeText = "", description = "", namesText = ""] = line.split("|");
    const code = codeText.trim();
    if (!/^\d{4}(\d{2})?$/.test(code)) continue;
    const seen = new Set<string>();
    const names: string[] = [];
    for (const n of namesText.split(";")) {
      const name = squash(n);
      const key = name.toLowerCase();
      if (name.length < 2 || name.length > 70 || !/[a-z]/i.test(name) || /[?|]/.test(name) || seen.has(key)) continue;
      seen.add(key);
      names.push(name);
      if (names.length >= MAX_NAMES) break;
    }
    out.push({ code, description: squash(description), kind, names });
  }
  return out;
}

const cache = new Map<ItemKind, CodeEntry[]>();

// All the entries of one kind, in table order (each code once: the first line of a code wins)
export function entriesOf(kind: ItemKind): CodeEntry[] {
  const hit = cache.get(kind);
  if (hit) return hit;
  const seen = new Set<string>();
  const all: CodeEntry[] = [];
  for (const text of kind === "Service" ? SERVICE_TABLES : GOODS_TABLES) {
    for (const e of parseTable(text, kind)) {
      if (seen.has(e.code)) continue;
      seen.add(e.code);
      all.push(e);
    }
  }
  cache.set(kind, all);
  return all;
}
