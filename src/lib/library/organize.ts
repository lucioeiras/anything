import type { LibraryItem, MediaProgressStatus } from './types';

export const STATUS_FOLDERS: { key: MediaProgressStatus; title: string; color: string }[] = [
  { key: 'want', title: 'Want to', color: '#93c5fd' },
  { key: 'in-progress', title: 'In progress', color: '#fcd34d' },
  { key: 'completed', title: 'Completed', color: '#6ee7b7' },
  { key: 'abandoned', title: 'Abandoned', color: '#a1a1aa' },
];

export function matchesStatus(item: LibraryItem, status: MediaProgressStatus): boolean {
  if (!('progressStatus' in item)) return false;
  return (item.progressStatus ?? 'want') === status;
}

export function getItemArtwork(item: LibraryItem): string | undefined {
  switch (item.type) {
    case 'image':
      return item.image;
    case 'book':
      return item.cover;
    case 'movie':
      return item.poster;
    case 'game':
      return item.cover;
    case 'music':
      return item.cover;
    case 'article':
    case 'youtube':
      return item.thumbnail;
    case 'tweet':
      return item.images?.[0] ?? item.video?.thumbnail;
    case 'reddit':
      return item.image;
    case 'link':
      return item.favicon;
    default:
      return undefined;
  }
}

export function getTagGroups(items: LibraryItem[]): { tag: string; items: LibraryItem[] }[] {
  const groups = new Map<string, LibraryItem[]>();
  for (const item of items) {
    for (const cleanTag of new Set((item.tags ?? []).map((tag) => tag.trim()))) {
      if (!cleanTag) continue;
      const group = groups.get(cleanTag) ?? [];
      group.push(item);
      groups.set(cleanTag, group);
    }
  }
  return [...groups]
    .map(([tag, taggedItems]) => ({ tag, items: taggedItems }))
    .sort((a, b) => b.items.length - a.items.length || a.tag.localeCompare(b.tag));
}
