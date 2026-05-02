import type { RecentItem } from "./types";

export const RECENT_LIMIT = 10;

export function appendRecent(items: RecentItem[], item: RecentItem): RecentItem[] {
  const deduped = items.filter((existing) => existing.id !== item.id);
  const sorted = [item, ...deduped].sort((a, b) => b.createdAt - a.createdAt);
  return sorted.slice(0, RECENT_LIMIT);
}
