// Showing amounts and dates the way the quote screens and documents do: Rs.205,596.00, 03/10/2026, "Indian Rupee Six Thousand Only".
// Pure functions, shared by the server and the browser.

export type Grouping = "western" | "indian";

const western = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const indian = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// 205596 -> "205,596.00" (or "2,05,596.00")
export function formatAmount(n: number, grouping: Grouping = "western"): string {
  const v = Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
  return (grouping === "indian" ? indian : western).format(v === 0 ? 0 : v); // never "-0.00"
}

// 205596 -> "Rs.205,596.00"; a symbol that ends in a letter gets a space: "INR 205,596.00"
export function formatMoney(n: number, symbol = "Rs.", grouping: Grouping = "western"): string {
  const v = Number.isFinite(n) ? n : 0;
  const text = formatAmount(Math.abs(v), grouping);
  return `${v < 0 && Math.abs(v) >= 0.005 ? "-" : ""}${symbol}${/[A-Za-z]$/.test(symbol) ? " " : ""}${text}`;
}

// 2026-10-03 -> 03/10/2026
export const formatQuoteDay = (day: string | null | undefined): string => (day && /^\d{4}-\d{2}-\d{2}/.test(day) ? `${day.slice(8, 10)}/${day.slice(5, 7)}/${day.slice(0, 4)}` : day ?? "");

// A quantity: 12 -> "12.00" like the quote screens; more decimals are kept (2.5 -> "2.50", 0.125 -> "0.125")
export function formatQuantity(n: number): string {
  if (!Number.isFinite(n)) return "0.00";
  const s = String(Math.round(n * 1e6) / 1e6);
  const [i, d = ""] = s.split(".");
  return `${i}.${d.padEnd(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Amount in words
// ---------------------------------------------------------------------------
const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function below100(n: number): string {
  if (n < 20) return ONES[n];
  return `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ""}`;
}

function below1000(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return [h ? `${ONES[h]} Hundred` : "", rest ? below100(rest) : ""].filter(Boolean).join(" ");
}

function wordsInternational(n: number): string {
  if (n === 0) return "Zero";
  const scales = ["", "Thousand", "Million", "Billion", "Trillion"];
  const parts: string[] = [];
  let i = 0;
  let rest = n;
  while (rest > 0 && i < scales.length) {
    const chunk = rest % 1000;
    if (chunk) parts.unshift(`${below1000(chunk)}${scales[i] ? ` ${scales[i]}` : ""}`);
    rest = Math.floor(rest / 1000);
    i++;
  }
  return parts.join(" ");
}

function wordsIndian(n: number): string {
  if (n === 0) return "Zero";
  const crore = Math.floor(n / 1e7);
  const lakh = Math.floor((n % 1e7) / 1e5);
  const thousand = Math.floor((n % 1e5) / 1e3);
  const rest = n % 1e3;
  return [
    crore ? `${wordsIndian(crore)} Crore` : "",
    lakh ? `${below100(lakh)} Lakh` : "",
    thousand ? `${below100(thousand)} Thousand` : "",
    rest ? below1000(rest) : "",
  ].filter(Boolean).join(" ");
}

// 6000 -> "Indian Rupee Six Thousand Only"; 1250.5 -> "Indian Rupee One Thousand Two Hundred Fifty and Fifty Paise Only"
export function amountInWords(amount: number, currencyName = "Indian Rupee", style: "international" | "indian" = "international"): string {
  const total = Math.round(Math.abs(Number.isFinite(amount) ? amount : 0) * 100);
  const rupees = Math.floor(total / 100);
  const paise = total % 100;
  const words = style === "indian" ? wordsIndian : wordsInternational;
  const text = `${words(rupees)}${paise ? ` and ${below100(paise)} Paise` : ""}`;
  return `${amount < 0 && total ? "Minus " : ""}${currencyName} ${text} Only`.replace(/\s+/g, " ").trim();
}
