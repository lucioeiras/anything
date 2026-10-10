import { decodeHTML } from 'entities';
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

  const item: Record<string, unknown> = {
    version: 1,
    updatedAt: createdAt,
    ...raw,
  };

  if (typeof item.title === 'string') {
    item.title = decodeHTML(item.title);
  }
  if (typeof item.siteTitle === 'string') {
    item.siteTitle = decodeHTML(item.siteTitle);
  }
  if (typeof item.description === 'string') {
    item.description = decodeHTML(item.description);
  }
  if (typeof item.origin === 'string') {
    item.origin = decodeHTML(item.origin);
  }
  if (typeof item.text === 'string') {
    item.text = decodeHTML(item.text);
  }
  if (typeof item.note === 'string') {
    item.note = decodeHTML(item.note);
  }
  if (item.type === 'book') {
    if (Array.isArray(item.authors)) {
      item.authors = item.authors.map((a) => (typeof a === 'string' ? decodeHTML(a) : String(a)));
    } else {
      item.authors = [];
    }
    if (typeof item.publisher === 'string') {
      item.publisher = decodeHTML(item.publisher);
    }
  }
  if (item.type === 'music') {
    if (typeof item.artist === 'string') {
      item.artist = decodeHTML(item.artist);
    }
    if (typeof item.album === 'string') {
      item.album = decodeHTML(item.album);
    }
    if (typeof item.genre === 'string') {
      item.genre = decodeHTML(item.genre);
    }
  }
  if (item.type === 'movie') {
    if (typeof item.originalTitle === 'string') {
      item.originalTitle = decodeHTML(item.originalTitle);
    }
    if (typeof item.overview === 'string') {
      item.overview = decodeHTML(item.overview);
    }
    if (typeof item.director === 'string') {
      item.director = decodeHTML(item.director);
    }
    if (Array.isArray(item.genres)) {
      item.genres = item.genres.map((g) => (typeof g === 'string' ? decodeHTML(g) : String(g)));
    }
  }
  if (item.type === 'game') {
    if (typeof item.description === 'string') {
      item.description = decodeHTML(item.description);
    }
    if (Array.isArray(item.platforms)) {
      item.platforms = item.platforms.map((p) =>
        typeof p === 'string' ? decodeHTML(p) : String(p)
      );
    }
    if (Array.isArray(item.genres)) {
      item.genres = item.genres.map((g) => (typeof g === 'string' ? decodeHTML(g) : String(g)));
    }
    if (Array.isArray(item.developers)) {
      item.developers = item.developers.map((d) =>
        typeof d === 'string' ? decodeHTML(d) : String(d)
      );
    }
    if (Array.isArray(item.publishers)) {
      item.publishers = item.publishers.map((p) =>
        typeof p === 'string' ? decodeHTML(p) : String(p)
      );
    }
  }

  return item as unknown as LibraryItem;
}

const REQUIRED_FIELDS: Record<LibraryItemType, string[]> = {
  note: ['text'],
  quote: ['text'],
  image: ['image'],
  pdf: ['pdf'],
  link: ['url', 'siteTitle', 'favicon'],
  article: ['url', 'title', 'thumbnail'],
  youtube: ['url', 'title', 'thumbnail'],
  tweet: ['author', 'avatar', 'text'],
  reddit: ['subreddit', 'subredditAvatar', 'title'],
  book: ['isbn', 'title'],
  music: ['title', 'artist', 'cover'],
  movie: ['title', 'poster'],
  game: ['title', 'cover'],
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
