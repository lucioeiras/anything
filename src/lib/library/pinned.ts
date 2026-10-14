import type { LibraryItem, LibraryItemType } from './types';

export const MAX_PINNED_ITEMS = 8;
const PINNED_ASPECT_RATIO_TYPES: LibraryItemType[] = [
  'image',
  'music',
  'book',
  'movie',
  'tvshow',
  'game',
];

export function shouldPreservePinnedAspectRatio(type: LibraryItemType): boolean {
  return PINNED_ASPECT_RATIO_TYPES.includes(type);
}

export function getPinnedItems(items: LibraryItem[]): LibraryItem[] {
  return items
    .filter((item) => Boolean(item.pinnedAt))
    .sort((a, b) => a.pinnedAt!.localeCompare(b.pinnedAt!));
}

export function movePinnedItem(
  items: LibraryItem[],
  itemId: string,
  targetIndex: number
): LibraryItem[] {
  const currentIndex = items.findIndex((item) => item.id === itemId);
  if (currentIndex < 0 || items.length < 2) return items;

  const next = [...items];
  const [item] = next.splice(currentIndex, 1);
  const boundedIndex = Math.max(0, Math.min(next.length, targetIndex));
  next.splice(boundedIndex, 0, item);
  return next;
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
