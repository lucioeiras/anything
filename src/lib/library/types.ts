/**
 * On-disk schema for library items.
 *
 * Every item is a single `<id>.json` file at the root of the library folder.
 * Local images live in `images/` and are referenced by a path *relative to the
 * library root* (e.g. `"images/abc.jpg"`). Remote URLs (`https://…`) and
 * `data:` URIs are also accepted, so an item can be saved before its assets
 * are downloaded.
 *
 * Keep this file free of React Native imports.
 */

export const SCHEMA_VERSION = 1 as const;

/** Relative path inside the library (`images/foo.jpg`) or a remote/data URI. */
export type ImageRef = string;

type BaseItem = {
  /** Stable unique id. Should match the file name (`<id>.json`). */
  id: string;
  /** Schema version, for future migrations. */
  version: typeof SCHEMA_VERSION;
  /** ISO-8601 timestamps. */
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  note?: string;
};

export type NoteItem = BaseItem & { type: 'note'; text: string; title?: string };
export type QuoteItem = BaseItem & { type: 'quote'; text: string; title?: string };
export type ImageItem = BaseItem & {
  type: 'image';
  image: ImageRef;
  title?: string;
  note?: string;
};

export type LinkItem = BaseItem & {
  type: 'link';
  url: string;
  siteTitle: string;
  description: string;
  favicon: ImageRef;
};

export type ArticleItem = BaseItem & {
  type: 'article';
  url: string;
  title: string;
  origin: string;
  thumbnail: ImageRef;
};

export type YouTubeItem = BaseItem & {
  type: 'youtube';
  url: string;
  title: string;
  thumbnail: ImageRef;
};

export type TweetItem = BaseItem & {
  type: 'tweet';
  url: string;
  author: string;
  avatar: ImageRef;
  text: string;
  images?: ImageRef[];
};

export type RedditItem = BaseItem & {
  type: 'reddit';
  url: string;
  subreddit: string;
  subredditAvatar: ImageRef;
  title: string;
  text?: string;
  image?: ImageRef;
};

export type LibraryItem =
  NoteItem | QuoteItem | ImageItem | LinkItem | ArticleItem | YouTubeItem | TweetItem | RedditItem;

export type LibraryItemType = LibraryItem['type'];

export const ITEM_TYPES: readonly LibraryItemType[] = [
  'note',
  'quote',
  'image',
  'link',
  'article',
  'youtube',
  'tweet',
  'reddit',
];

/** Name of the sub-folder holding local image assets. */
export const IMAGES_DIR = 'images';
