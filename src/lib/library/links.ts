import type { LibraryItem } from './types';

export type LinkableItem = Extract<
  LibraryItem,
  {
    type:
      'article' | 'youtube' | 'tiktok' | 'link' | 'movie' | 'tvshow' | 'book' | 'game' | 'music';
  }
>;

export function isLinkableItem(item: LibraryItem): item is LinkableItem {
  return [
    'article',
    'youtube',
    'tiktok',
    'link',
    'movie',
    'tvshow',
    'book',
    'game',
    'music',
  ].includes(item.type);
}

export function getLinkableTitle(item: LinkableItem): string {
  return item.type === 'link' ? item.title || item.siteTitle : item.title;
}

export function getLinkableTypeLabel(item: LinkableItem): string {
  if (item.type === 'youtube') return 'YouTube';
  if (item.type === 'tiktok') return 'TikTok';
  if (item.type === 'music') return item.musicKind === 'album' ? 'Album' : 'Song';
  if (item.type === 'tvshow') return 'TV Show';
  return item.type.charAt(0).toUpperCase() + item.type.slice(1);
}
