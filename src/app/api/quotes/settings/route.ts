import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, withAuthRoute } from "@/lib/api";
import { needQuotes, quoteAbilities } from "@/lib/quotes/access";
import { loadSettings, saveSettingsGroup } from "@/lib/quotes/settings";
import { companyImageUrls, dropReplacedCompanyFiles } from "@/lib/quotes/settings-files";

const schema = z.object({ group: z.string().min(1).max(30), value: z.unknown() }).strict();

// GET /api/quotes/settings — Quote Settings (numbering, taxes, TDS / TCS, rounding, display, company, messages). Needs view.
export async function GET(request: Request) {
  return withAuthRoute(request, async ctx => {
    needQuotes(ctx, "view");
    const settings = await loadSettings();
    return NextResponse.json({ settings, images: await companyImageUrls(settings.company), abilities: quoteAbilities(ctx) });
  });
}

// PUT /api/quotes/settings { group, value } — saves one group of the settings. Super Admin only.
export async function PUT(request: Request) {
  return withAuthRoute(request, async ctx => {
    const { group, value } = await readJson(request, schema);
    const before = group === "company" ? (await loadSettings()).company : null;
    const settings = await saveSettingsGroup(ctx, group, value);
    if (before) await dropReplacedCompanyFiles(before, settings.company);
    return NextResponse.json({ settings, images: await companyImageUrls(settings.company) });
  });
}
