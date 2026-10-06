// The document of a quote, with what only the database knows: short-lived links to the company pictures.

import type { ModuleLayoutDto } from "@/lib/records/types";
import { buildDoc, type QuoteDoc } from "./doc";
import { companyImageUrls } from "./settings-files";
import type { QuoteDto, QuoteSettings } from "./types";

export async function documentOf(quote: QuoteDto, layout: ModuleLayoutDto, settings: QuoteSettings): Promise<QuoteDoc> {
  return buildDoc(quote, layout, settings, await companyImageUrls(settings.company));
}
