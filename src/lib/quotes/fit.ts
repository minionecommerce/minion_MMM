// How big the quote document is drawn on the Quote Details page: the document is 794 px wide (an A4 page); the page shows it as wide as the space beside the list
// of quotes allows, a little smaller when the space is short (nothing is cut off, nothing scrolls sideways) and a little larger when there is plenty.
export const FIT_MIN = 0.5;
export const FIT_MAX = 1.35;

export function fitScale(available: number, width: number, min = FIT_MIN, max = FIT_MAX): number {
  if (!(available > 0) || !(width > 0)) return 1; // not measured yet
  return Math.round(Math.min(max, Math.max(min, available / width)) * 1000) / 1000;
}
