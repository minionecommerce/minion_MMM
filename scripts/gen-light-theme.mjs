// Generates src/app/light-theme.css — the white & yellow theme for every page except Home.
// Run: node scripts/gen-light-theme.mjs
//
// The CRM pages were written against a dark palette with hard-coded Tailwind classes. Instead of editing
// ~150 files, this layer re-maps those classes. It does NOT apply to:
//   - the Home page          (marked with [data-home]; disables the whole layer via :has)
//   - the left sidebar       (marked with [data-sidebar])
//   - already-light screens  (marked with [data-light-native], e.g. /leads)
import { writeFileSync } from "node:fs";

const esc = (s) => s.replace(/([^a-zA-Z0-9_-])/g, "\\$1");
const PREFIX = "body:not(:has([data-home]))";
const SKIP = ":not([data-sidebar], [data-sidebar] *, [data-light-native], [data-light-native] *)";

const out = [];
// variants: base | hover | group-hover | focus
const sel = (variant, cls) => {
  const c = esc(cls);
  switch (variant) {
    case "hover": return `${PREFIX} .${esc("hover:" + cls)}:hover${SKIP}`;
    case "focus": return `${PREFIX} .${esc("focus:" + cls)}:focus${SKIP}`;
    case "group-hover": return `${PREFIX} .group:hover .${esc("group-hover:" + cls)}${SKIP}`;
    case "placeholder": return `${PREFIX} .${esc("placeholder-" + cls)}${SKIP}::placeholder`;
    default: return `${PREFIX} .${c}${SKIP}`;
  }
};
const rule = (variants, cls, decl) => {
  for (const v of variants) out.push(`${sel(v, cls)} { ${decl} }`);
};
const ALL = ["", "hover", "group-hover", "focus"];

// ---- Surfaces ----
const bg = (c, v, vs = [""]) => rule(vs, `bg-[${c}]`, `background-color: ${v};`);
bg("#0D0D0F", "#FAFAF7", ["", "hover"]);
bg("#151619", "#FFFFFF", ["", "hover"]);
bg("#111113", "#F5F3EC", ["", "hover"]);
bg("#292B30", "#E8E5DA", ["", "hover"]);
bg("#1a1b1e", "#FFF8DC", ["", "hover"]);
bg("#1a1b1f", "#FFF8DC", ["", "hover"]);
bg("#222326", "#F0EDE2", ["", "hover"]);
bg("#1e2025", "#F0EDE2", ["", "hover"]);
bg("#3B2E15", "#FFF3C4");
rule(["", "hover"], "bg-neutral-950", "background-color: #FAFAF7;");
rule(["", "hover"], "bg-neutral-900", "background-color: #FFFFFF;");
rule(["", "hover"], "bg-neutral-800", "background-color: #F0EDE2;");
rule([""], "bg-gray-900", "background-color: #FFFFFF;");
rule([""], "bg-gray-800", "background-color: #F0EDE2;");
rule(["", "hover"], "bg-white/10", "background-color: rgb(17 24 39 / 0.05);");
rule(["", "hover"], "bg-white/5", "background-color: rgb(17 24 39 / 0.03);");
rule(["", "hover"], "bg-white/20", "background-color: rgb(17 24 39 / 0.1);");
rule([""], "border-white/5", "border-color: rgb(17 24 39 / 0.08);");
rule(["", "hover"], "border-white/10", "border-color: rgb(17 24 39 / 0.12);");
rule(["", "hover"], "border-white/20", "border-color: rgb(17 24 39 / 0.18);");

// gradients that faded into the dark page
for (const [c, v] of [["#151619", "#FFFFFF"], ["#0D0D0F", "#FAFAF7"], ["#1a1b1f", "#FFF8DC"], ["#1a1505", "#FFF3C4"]]) {
  out.push(`${PREFIX} .${esc(`from-[${c}]`)}${SKIP} { --tw-gradient-from: ${v}; }`);
  out.push(`${PREFIX} .${esc(`via-[${c}]`)}${SKIP} { --tw-gradient-via: ${v}; }`);
  out.push(`${PREFIX} .${esc(`to-[${c}]`)}${SKIP} { --tw-gradient-to: ${v}; }`);
}

// ---- Borders ----
for (const c of ["#292B30", "#3f4148"]) rule(["", "hover", "focus"], `border-[${c}]`, "border-color: #E7E5DE;");
rule([""], "border-[#1e2025]", "border-color: #EFEDE4;");
for (const c of ["#292B30", "#1e2025"]) {
  const v = c === "#292B30" ? "#E7E5DE" : "#EFEDE4";
  out.push(`${PREFIX} .${esc(`divide-[${c}]`)} > :not(:last-child) { border-color: ${v}; }`);
  out.push(`${PREFIX} .${esc(`divide-[${c}]/50`)} > :not(:last-child) { border-color: ${v}; }`);
}
rule([""], "border-neutral-800", "border-color: #E7E5DE;");
rule([""], "border-neutral-700", "border-color: #D6D3C7;");
rule([""], "border-gray-800", "border-color: #E7E5DE;");
rule([""], "border-gray-600", "border-color: #D6D3C7;");

// ---- Text ----
rule(ALL, "text-white", "color: #111827;");
rule(ALL, "text-gray-200", "color: #1F2937;");
rule(ALL, "text-gray-300", "color: #374151;");
rule(ALL, "text-gray-400", "color: #4B5563;");
rule(ALL, "text-gray-500", "color: #6B7280;");
rule(ALL, "text-gray-600", "color: #6B7280;");
rule([""], "text-gray-700", "color: #9CA3AF;");
rule(["placeholder"], "gray-700", "color: #9CA3AF;");
rule(["placeholder"], "gray-600", "color: #9CA3AF;");
rule(["placeholder"], "gray-500", "color: #9CA3AF;");
rule([""], "text-neutral-200", "color: #1F2937;");
rule([""], "text-neutral-300", "color: #374151;");
rule([""], "text-neutral-400", "color: #4B5563;");
rule([""], "text-neutral-500", "color: #6B7280;");
rule(["placeholder"], "neutral-500", "color: #9CA3AF;");

// Bright "-400" status colours are unreadable on white: use the -700 shade
const ink = {
  yellow: "#A16207", amber: "#B45309", green: "#15803D", red: "#B91C1C", blue: "#1D4ED8",
  orange: "#C2410C", purple: "#7E22CE", pink: "#BE185D", cyan: "#0E7490", teal: "#0F766E",
  indigo: "#4338CA", emerald: "#047857", sky: "#0369A1", violet: "#6D28D9", rose: "#BE123C", lime: "#4D7C0F",
};
for (const [name, hex] of Object.entries(ink)) {
  for (const shade of [300, 400]) {
    for (const alpha of ["", "/80", "/70", "/60", "/50"]) {
      rule(["", "hover", "group-hover"], `text-${name}-${shade}${alpha}`, `color: ${hex};`);
    }
  }
}
rule(["", "hover"], "text-yellow-500", "color: #A16207;");
rule(["", "hover"], "text-yellow-600", "color: #A16207;");
// …but yellow text that sits ON a yellow button is handled below (stays dark)

// ---- Solid colour backgrounds keep light text ----
const keepLight = [
  "bg-green-500", "bg-green-400", "bg-red-500", "bg-purple-500", "bg-blue-500", "bg-blue-400",
  "bg-[#d9232b]", "bg-[#c89f59]", "bg-[#b58b4b]", "bg-[#444]", "bg-[#1A1A1A]", "bg-black", "bg-[#5b4bdb]",
  "bg-[#4c3dc4]", "bg-[#dc3545]", "bg-[#c82333]", "bg-[#5b6068]", "bg-[#333]", "bg-[#222]", "bg-[#111111]",
];
for (const b of keepLight) {
  out.push(`${PREFIX} .text-white.${esc(b)}${SKIP} { color: #FFFFFF; }`);
  out.push(`${PREFIX} .${esc(b)} .text-white${SKIP} { color: #FFFFFF; }`);
}
for (const b of ["bg-yellow-400", "bg-yellow-500", "bg-[#f5b800]", "bg-[#e0a800]"]) {
  out.push(`${PREFIX} .text-white.${esc(b)}${SKIP}, ${PREFIX} .${esc(b)} .text-white${SKIP} { color: #111827; }`);
}

// ---- Page chrome ----
out.push(`${PREFIX} { background-color: #FAFAF7; color: #111827; }`);
out.push(`${PREFIX} :is(input, select, textarea)${SKIP} { color-scheme: light; }`);

writeFileSync(
  new URL("../src/app/light-theme.css", import.meta.url),
  `/* GENERATED by scripts/gen-light-theme.mjs — do not edit by hand. White & yellow theme for all pages except Home. */\n` +
    out.join("\n") + "\n",
);
console.log(`wrote ${out.length} rules`);
