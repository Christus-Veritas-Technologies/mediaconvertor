import type { ConversionRecentItem } from "./types";

export const RECENT_LIMIT = 10;

export function appendRecent(
  items: ConversionRecentItem[],
  item: ConversionRecentItem,
): ConversionRecentItem[] {
  const deduped = items.filter((existing) => existing.id !== item.id);
  return [item, ...deduped].slice(0, RECENT_LIMIT);
}
