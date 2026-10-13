import type { LibraryItem } from './types';

export const MAX_PINNED_ITEMS = 8;

export function getPinnedItems(items: LibraryItem[]): LibraryItem[] {
  return items
    .filter((item) => Boolean(item.pinnedAt))
    .sort((a, b) => a.pinnedAt!.localeCompare(b.pinnedAt!));
}

export function canPinItem(items: LibraryItem[], itemId: string): boolean {
  const item = items.find((candidate) => candidate.id === itemId);
  return (
    Boolean(item && item.pinnedAt) ||
    items.filter((candidate) => candidate.pinnedAt).length < MAX_PINNED_ITEMS
  );
}

export function nextPinnedAt(items: LibraryItem[], now = Date.now()): string {
  const latestPinnedAt = items.reduce(
    (latest, item) => Math.max(latest, item.pinnedAt ? Date.parse(item.pinnedAt) : 0),
    0
  );
  return new Date(Math.max(now, latestPinnedAt + 1)).toISOString();
}
