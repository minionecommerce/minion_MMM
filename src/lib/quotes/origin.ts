// The address of this site as the person's browser sees it: the share link of a quote is built on it. Behind Vercel the host is in the
// forwarded headers.

export function originFromHeaders(h: { get(name: string): string | null }, fallbackHost = "localhost:3000"): string {
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? fallbackHost;
  const proto = h.get("x-forwarded-proto")?.split(",")[0].trim() ?? (/^(localhost|127\.0\.0\.1)/.test(host) ? "http" : "https");
  return `${proto}://${host}`;
}
