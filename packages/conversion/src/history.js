export const RECENT_LIMIT = 10;
export function appendRecent(items, item) {
    const deduped = items.filter((existing) => existing.id !== item.id);
    return [item, ...deduped].slice(0, RECENT_LIMIT);
}
