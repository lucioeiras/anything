import { ITEM_TYPES, type LibraryItem, type LibraryItemType } from './types';

/**
 * Lightweight runtime validation for item JSON. Files on disk can be edited by
 * hand or synced from other devices, so never trust their shape.
 *
 * Returns the item or throws an Error describing what is wrong.
 */
export function parseItem(raw: unknown): LibraryItem {
  if (!isObject(raw)) throw new Error('not a JSON object');

  const { id, type, createdAt } = raw;
  if (typeof id !== 'string' || !id) throw new Error('missing "id"');
  if (typeof type !== 'string' || !ITEM_TYPES.includes(type as LibraryItemType)) {
    throw new Error(`unknown "type": ${String(type)}`);
  }
  if (typeof createdAt !== 'string') throw new Error('missing "createdAt"');

  const required = REQUIRED_FIELDS[type as LibraryItemType];
  for (const field of required) {
    if (typeof raw[field] !== 'string' || !raw[field]) {
      throw new Error(`"${type}" item is missing "${field}"`);
    }
  }

  return {
    version: 1,
    updatedAt: createdAt,
    ...raw,
  } as LibraryItem;
}

const REQUIRED_FIELDS: Record<LibraryItemType, string[]> = {
  note: ['text'],
  quote: ['text'],
  image: ['image'],
  link: ['url', 'siteTitle', 'favicon'],
  article: ['url', 'title', 'thumbnail'],
  youtube: ['url', 'title', 'thumbnail'],
  tweet: ['author', 'avatar', 'text'],
  reddit: ['subreddit', 'subredditAvatar', 'title'],
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
