// Terms & Conditions templates of the quote form: the list the dropdown offers, which one a quote's text came from, and what is wrong with a list
// before it is saved. Pure: the server checks the list again with the same limits (parseTerms in settings.ts).

import type { TermsSettings, TermsTemplate } from "./types";

export const TERMS_TITLE_MAX = 60;
export const TERMS_CONTENT_MAX = 10_000; // the same as the Terms & Conditions field of the quote
export const TERMS_MAX_TEMPLATES = 200;
export const STANDARD_TEMPLATE_ID = "standard";

// The templates the quote form offers. Until a Super Admin has saved the list once there is only one, "Standard": the text the Terms & Conditions
// field of the quote starts with (set in Edit Page Layout), so nothing is invented and the first save keeps it as a template of its own.
export function termsTemplatesOf(terms: TermsSettings, standardText: string): TermsTemplate[] {
  if (terms.configured) return terms.templates;
  const text = standardText.trim();
  return text ? [{ id: STANDARD_TEMPLATE_ID, title: "Standard", content: text }] : [];
}

// The template whose text a quote has right now (a quote that was opened, or a new one with the standard text), else ""
export function matchTemplateId(templates: TermsTemplate[], text: string): string {
  const t = text.replace(/\r\n?/g, "\n").trim();
  return t ? templates.find(x => x.content === t)?.id ?? "" : "";
}

// The first problem of a list that is about to be saved: which template and what to tell the person, or null when it can be saved
export function termsProblem(list: readonly TermsTemplate[]): { id: string; message: string } | null {
  if (list.length > TERMS_MAX_TEMPLATES) return { id: list[TERMS_MAX_TEMPLATES].id, message: `There can be ${TERMS_MAX_TEMPLATES} templates at most.` };
  const seen = new Set<string>();
  for (const t of list) {
    const title = t.title.trim();
    if (!title) return { id: t.id, message: "Give the template a title." };
    if (title.length > TERMS_TITLE_MAX) return { id: t.id, message: `A title can be ${TERMS_TITLE_MAX} characters long at most.` };
    if (seen.has(title.toLowerCase())) return { id: t.id, message: `There are two templates called "${title}".` };
    seen.add(title.toLowerCase());
    if (!t.content.trim()) return { id: t.id, message: `Write the Terms & Conditions of "${title}".` };
    if (t.content.length > TERMS_CONTENT_MAX) return { id: t.id, message: `The Terms & Conditions of "${title}" can be ${TERMS_CONTENT_MAX.toLocaleString("en-IN")} characters long at most.` };
  }
  return null;
}
