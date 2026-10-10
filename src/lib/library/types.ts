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

/** Relative path inside the library (`pdfs/foo.pdf`) or a remote/data URI. */
export type PdfRef = string;

type BaseItem = {
  /** Stable unique id. Should match the file name (`<id>.json`). */
  id: string;
  /** Schema version, for future migrations. */
  version: typeof SCHEMA_VERSION;
  /** ISO-8601 timestamps. */
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  autoTags?: string[];
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
export type PdfItem = BaseItem & {
  type: 'pdf';
  pdf: PdfRef;
  title?: string;
  note?: string;
};

export type LinkItem = BaseItem & {
  type: 'link';
  url: string;
  siteTitle: string;
  description: string;
  favicon: ImageRef;
  title?: string;
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

export type TweetVideo = {
  url: string;
  thumbnail?: ImageRef;
  width?: number;
  height?: number;
  aspectRatio?: number;
};

export type TweetItem = BaseItem & {
  type: 'tweet';
  url: string;
  author: string;
  avatar: ImageRef;
  text: string;
  images?: ImageRef[];
  video?: TweetVideo;
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

export type BookItem = BaseItem & {
  type: 'book';
  isbn: string;
  title: string;
  authors: string[];
  cover?: ImageRef;
  coverAspectRatio?: number;
  description?: string;
  publisher?: string;
  publishedDate?: string;
  pageCount?: number;
  url?: string;
};

export type MusicItem = BaseItem & {
  type: 'music';
  title: string;
  artist: string;
  album?: string;
  cover: ImageRef;
  previewUrl?: string;
  externalUrl?: string;
  durationMs?: number;
  releaseDate?: string;
  genre?: string;
};

export type MovieItem = BaseItem & {
  type: 'movie';
  tmdbId: number;
  title: string;
  originalTitle?: string;
  poster: ImageRef;
  backdrop?: ImageRef;
  releaseDate?: string;
  releaseYear?: string;
  overview?: string;
  voteAverage?: number;
  genres?: string[];
  director?: string;
  runtime?: number;
};

export type GameItem = BaseItem & {
  type: 'game';
  rawgId?: number;
  title: string;
  cover: ImageRef;
  platforms?: string[];
  genres?: string[];
  released?: string;
  releaseYear?: string;
  rating?: number;
  metacritic?: number;
  description?: string;
  developers?: string[];
  publishers?: string[];
  esrbRating?: string;
  website?: string;
};

export type LibraryItem =
  | NoteItem
  | QuoteItem
  | ImageItem
  | PdfItem
  | LinkItem
  | ArticleItem
  | YouTubeItem
  | TweetItem
  | RedditItem
  | BookItem
  | MusicItem
  | MovieItem
  | GameItem;

export type LibraryItemType = LibraryItem['type'];

export const ITEM_TYPES: readonly LibraryItemType[] = [
  'note',
  'quote',
  'image',
  'pdf',
  'link',
  'article',
  'youtube',
  'tweet',
  'reddit',
  'book',
  'music',
  'movie',
  'game',
];

/** Name of the sub-folder holding local image assets. */
export const IMAGES_DIR = 'images';

/** Name of the sub-folder holding local PDF assets. */
export const PDFS_DIR = 'pdfs';
