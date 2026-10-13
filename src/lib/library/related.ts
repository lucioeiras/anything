import type { LibraryItem } from './types';

export function normalizeRelatedIds(value: unknown, itemId: string): string[] {
  return Array.isArray(value)
    ? [
        ...new Set(
          value.filter((id): id is string => typeof id === 'string' && !!id.trim() && id !== itemId)
        ),
      ]
    : [];
}

/** Include incoming links too, so hand-edited/asymmetric files remain navigable. */
export function getRelatedItems(item: LibraryItem, items: LibraryItem[]): LibraryItem[] {
  const ids = new Set(item.relatedItemIds);
  return items.filter(
    (candidate) =>
      candidate.id !== item.id &&
      (ids.has(candidate.id) || candidate.relatedItemIds?.includes(item.id))
  );
}

export function getRelatedCardTitle(item: LibraryItem): string {
  return (
    ('title' in item && item.title) ||
    ('siteTitle' in item && item.siteTitle) ||
    ('text' in item && item.text) ||
    ('originalFileName' in item && item.originalFileName) ||
    item.type
  );
}
