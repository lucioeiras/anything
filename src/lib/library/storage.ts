import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';

import { parseItem } from './parse';
import { resolveUrlMetadata } from './metadata';
import {
  IMAGES_DIR,
  SCHEMA_VERSION,
  type ArticleItem,
  type ImageItem,
  type ImageRef,
  type LibraryItem,
  type LinkItem,
  type NoteItem,
  type QuoteItem,
  type RedditItem,
  type YouTubeItem,
} from './types';

// The native module won't exist if running in Expo Go.
let AnythingLibraryAccess: {
  bookmarkFolder: (uri: string) => string | null;
  resolveBookmark: (base64: string) => string | null;
} | null = null;

try {
  AnythingLibraryAccess =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../../../modules/anything-library-access/src/AnythingLibraryAccessModule').default;
} catch {
  // Fallback for environments without custom native modules
}

/**
 * Where the library is read from.
 *
 * - `local`: `<App Documents>/Library`. With `enableFileSharing` this shows up in
 *   the Files app under "On My iPhone › anything" and in Finder when the phone is
 *   plugged in, so you can drop files in by hand.
 * - `folder`: any folder the user picked with the system document picker,
 *   including folders inside iCloud Drive. iOS grants security-scoped access for
 *   the current session only (see README notes on persisting it).
 */
export type LibrarySource =
  | { kind: 'local'; name?: string }
  | { kind: 'folder'; uri: string; bookmark?: string; name?: string };

export type SavedFolder = {
  id: string;
  name: string;
  source: LibrarySource;
  lastOpenedAt: number;
};

export const LOCAL_LIBRARY_NAME = 'Library';

export function getFolderDisplayName(source: LibrarySource): string {
  if (source.name) return source.name;
  if (source.kind === 'local') return LOCAL_LIBRARY_NAME;
  try {
    const cleaned = source.uri.replace(/\/+$/, '');
    const segment = cleaned.split('/').pop();
    if (segment) return decodeURIComponent(segment);
  } catch {
    // fallback
  }
  return 'Folder';
}

export function getLibraryDirectory(source: LibrarySource): Directory {
  return source.kind === 'local'
    ? new Directory(Paths.document, LOCAL_LIBRARY_NAME)
    : new Directory(source.uri);
}

const STORAGE_KEY = 'anything:librarySource';
const RECENT_FOLDERS_KEY = 'anything:recentFolders';

export const DEFAULT_LOCAL_FOLDER: SavedFolder = {
  id: 'local',
  name: 'App Library',
  source: { kind: 'local', name: 'App Library' },
  lastOpenedAt: 0,
};

export async function getSavedLibrarySource(): Promise<LibrarySource | null> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    const parsed: LibrarySource = JSON.parse(saved);
    if (parsed.kind === 'local') return { kind: 'local', name: parsed.name || 'App Library' };

    if (parsed.kind === 'folder') {
      if (parsed.bookmark && AnythingLibraryAccess) {
        const uri = AnythingLibraryAccess.resolveBookmark(parsed.bookmark);
        if (uri) {
          return { kind: 'folder', uri, bookmark: parsed.bookmark, name: parsed.name };
        }
      }
      return parsed;
    }
  } catch (e) {
    console.warn('Failed to load library source', e);
  }
  return null;
}

export async function saveLibrarySource(source: LibrarySource) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(source));
  } catch (e) {
    console.warn('Failed to save library source', e);
  }
}

export function resolveFolderSource(source: LibrarySource): LibrarySource {
  if (source.kind === 'folder' && source.bookmark && AnythingLibraryAccess) {
    try {
      const uri = AnythingLibraryAccess.resolveBookmark(source.bookmark);
      if (uri) {
        return { ...source, uri };
      }
    } catch (e) {
      console.warn('Failed to resolve bookmark', e);
    }
  }
  return source;
}

export async function getRecentFolders(): Promise<SavedFolder[]> {
  try {
    const saved = await AsyncStorage.getItem(RECENT_FOLDERS_KEY);
    if (!saved) {
      const lastSource = await getSavedLibrarySource();
      if (lastSource?.kind === 'folder') {
        const initial: SavedFolder[] = [
          {
            id: lastSource.uri,
            name: getFolderDisplayName(lastSource),
            source: lastSource,
            lastOpenedAt: Date.now(),
          },
          DEFAULT_LOCAL_FOLDER,
        ];
        await AsyncStorage.setItem(RECENT_FOLDERS_KEY, JSON.stringify(initial));
        return initial;
      }
      return [DEFAULT_LOCAL_FOLDER];
    }
    const parsed: SavedFolder[] = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [DEFAULT_LOCAL_FOLDER];

    if (!parsed.some((f) => f.id === 'local' || f.source.kind === 'local')) {
      parsed.push(DEFAULT_LOCAL_FOLDER);
    }
    return parsed;
  } catch (e) {
    console.warn('Failed to load recent folders', e);
    return [DEFAULT_LOCAL_FOLDER];
  }
}

export async function saveRecentFolder(source: LibrarySource): Promise<SavedFolder[]> {
  try {
    const list = await getRecentFolders();
    const id = source.kind === 'local' ? 'local' : source.uri;
    const name = source.name || getFolderDisplayName(source);
    const updatedSource = { ...source, name };

    const filtered = list.filter((f) => f.id !== id);
    const entry: SavedFolder = {
      id,
      name,
      source: updatedSource,
      lastOpenedAt: Date.now(),
    };

    const nextList = [entry, ...filtered];
    await AsyncStorage.setItem(RECENT_FOLDERS_KEY, JSON.stringify(nextList));
    return nextList;
  } catch (e) {
    console.warn('Failed to save recent folder', e);
    return [];
  }
}

export async function removeRecentFolder(id: string): Promise<SavedFolder[]> {
  try {
    const list = await getRecentFolders();
    const filtered = list.filter((f) => f.id !== id);
    if (!filtered.some((f) => f.id === 'local')) {
      filtered.push(DEFAULT_LOCAL_FOLDER);
    }
    await AsyncStorage.setItem(RECENT_FOLDERS_KEY, JSON.stringify(filtered));
    return filtered;
  } catch (e) {
    console.warn('Failed to remove recent folder', e);
    return [];
  }
}

/** Opens the system folder picker (Files / iCloud Drive). Throws if cancelled. */
export async function pickLibraryFolder(): Promise<LibrarySource> {
  const dir = await Directory.pickDirectoryAsync();
  const bookmark = AnythingLibraryAccess?.bookmarkFolder(dir.uri) ?? undefined;
  const name = dir.name || getFolderDisplayName({ kind: 'folder', uri: dir.uri });
  const source: LibrarySource = { kind: 'folder', uri: dir.uri, bookmark, name };
  await saveLibrarySource(source);
  await saveRecentFolder(source);
  return source;
}

export type LoadIssue = { file: string; reason: string };

export type LoadResult = {
  items: LibraryItem[];
  /** Files that exist but could not be parsed. */
  issues: LoadIssue[];
  /** iCloud files that are not downloaded to this device yet. */
  pendingDownloads: number;
};

/**
 * Reads every `*.json` file at the root of the library folder, validates it and
 * resolves relative image paths to `file://` URIs.
 */
export async function loadLibrary(source: LibrarySource): Promise<LoadResult> {
  const root = getLibraryDirectory(source);

  if (!root.exists) {
    if (source.kind === 'local') root.create({ intermediates: true, idempotent: true });
    return { items: [], issues: [], pendingDownloads: 0 };
  }

  const entries = root.list();
  let pendingDownloads = 0;
  const jsonFiles: File[] = [];

  for (const entry of entries) {
    if (!(entry instanceof File)) continue;
    // iCloud keeps not-yet-downloaded files as hidden `.name.json.icloud` placeholders.
    if (entry.name.startsWith('.') && entry.name.endsWith('.json.icloud')) {
      pendingDownloads++;
      continue;
    }
    if (entry.name.startsWith('.') || !entry.name.toLowerCase().endsWith('.json')) continue;
    jsonFiles.push(entry);
  }

  const results = await Promise.allSettled(
    jsonFiles.map(async (file) => resolveImages(parseItem(JSON.parse(await file.text())), root))
  );

  const items: LibraryItem[] = [];
  const issues: LoadIssue[] = [];
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') items.push(result.value);
    else issues.push({ file: jsonFiles[i].name, reason: errorMessage(result.reason) });
  });

  items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));

  return { items, issues, pendingDownloads };
}

/** Turns `images/foo.jpg` into an absolute `file://` URI; leaves URLs untouched. */
export function resolveImageRef(ref: ImageRef, root: Directory): string {
  if (/^(https?:|data:|file:)/i.test(ref)) return ref;
  const relative = ref.replace(/^\.?\//, '');
  return new File(root, relative).uri;
}

function resolveImages(item: LibraryItem, root: Directory): LibraryItem {
  const r = (ref: ImageRef) => resolveImageRef(ref, root);
  switch (item.type) {
    case 'image':
      return { ...item, image: r(item.image) };
    case 'link':
      return { ...item, favicon: r(item.favicon) };
    case 'article':
    case 'youtube':
      return { ...item, thumbnail: r(item.thumbnail) };
    case 'tweet':
      return { ...item, avatar: r(item.avatar), images: item.images?.map(r) };
    case 'reddit':
      return {
        ...item,
        subredditAvatar: r(item.subredditAvatar),
        image: item.image ? r(item.image) : undefined,
      };
    default:
      return item;
  }
}

export function getImagesDirectory(source: LibrarySource): Directory {
  return new Directory(getLibraryDirectory(source), IMAGES_DIR);
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export type PickedImageAsset = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

/**
 * Copies a picked image into the library's `images/` folder and writes the
 * corresponding `<id>.json` metadata file to the root of the library.
 */
export async function addImageToLibrary(
  source: LibrarySource,
  asset: PickedImageAsset
): Promise<ImageItem> {
  const root = getLibraryDirectory(source);
  if (!root.exists) {
    root.create({ intermediates: true, idempotent: true });
  }

  const imagesDir = getImagesDirectory(source);
  if (!imagesDir.exists) {
    imagesDir.create({ intermediates: true, idempotent: true });
  }

  const id = generateId();

  // Determine file extension
  let ext = 'jpg';
  if (asset.fileName && asset.fileName.includes('.')) {
    const parts = asset.fileName.split('.');
    const potentialExt = parts[parts.length - 1].toLowerCase();
    if (potentialExt && potentialExt.length <= 5 && /^[a-z0-9]+$/.test(potentialExt)) {
      ext = potentialExt;
    }
  } else if (asset.mimeType) {
    const mimeMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/heic': 'heic',
      'image/heif': 'heif',
      'image/svg+xml': 'svg',
    };
    if (mimeMap[asset.mimeType]) {
      ext = mimeMap[asset.mimeType];
    }
  } else if (asset.uri.includes('.')) {
    const cleanUri = asset.uri.split('?')[0];
    const parts = cleanUri.split('.');
    const potentialExt = parts[parts.length - 1].toLowerCase();
    if (potentialExt && potentialExt.length <= 5 && /^[a-z0-9]+$/.test(potentialExt)) {
      ext = potentialExt;
    }
  }

  const imageFileName = `${id}.${ext}`;
  const relativeImagePath = `${IMAGES_DIR}/${imageFileName}`;

  const sourceFile = new File(asset.uri);
  const targetImageFile = new File(imagesDir, imageFileName);

  try {
    await sourceFile.copy(targetImageFile, { overwrite: true });
  } catch (copyError) {
    console.warn('sourceFile.copy failed, using arrayBuffer copy fallback', copyError);
    const buffer = await sourceFile.arrayBuffer();
    if (!targetImageFile.exists) {
      targetImageFile.create({ intermediates: true, overwrite: true });
    }
    targetImageFile.write(new Uint8Array(buffer));
  }

  const now = new Date().toISOString();
  const item: ImageItem = {
    id,
    version: SCHEMA_VERSION,
    type: 'image',
    image: relativeImagePath,
    createdAt: now,
    updatedAt: now,
  };

  const jsonFile = new File(root, `${id}.json`);
  if (!jsonFile.exists) {
    jsonFile.create({ intermediates: true, overwrite: true });
  }
  jsonFile.write(JSON.stringify(item, null, 2));

  return item;
}

/**
 * Creates a note or quote item file in the root of the library folder.
 * Automatically verifies if the text is a quote (starts and ends with ") or a note.
 */
export async function addTextItemToLibrary(
  source: LibrarySource,
  rawText: string,
  title?: string
): Promise<NoteItem | QuoteItem> {
  const root = getLibraryDirectory(source);
  if (!root.exists) {
    root.create({ intermediates: true, idempotent: true });
  }

  const trimmed = rawText.trim();
  const isQuote =
    (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) ||
    (trimmed.startsWith('“') && trimmed.endsWith('”') && trimmed.length >= 2);

  const cleanText = isQuote ? trimmed.slice(1, -1).trim() : trimmed;
  const itemType: 'quote' | 'note' = isQuote ? 'quote' : 'note';

  const id = generateId();
  const now = new Date().toISOString();

  const item: NoteItem | QuoteItem = {
    id,
    version: SCHEMA_VERSION,
    type: itemType,
    text: cleanText,
    ...(title ? { title } : {}),
    createdAt: now,
    updatedAt: now,
  };

  const jsonFile = new File(root, `${id}.json`);
  if (!jsonFile.exists) {
    jsonFile.create({ intermediates: true, overwrite: true });
  }
  jsonFile.write(JSON.stringify(item, null, 2));

  return item;
}

export type LinkUploadItem = LinkItem | ArticleItem | YouTubeItem | RedditItem;

/**
 * Loads metadata for the given URL and saves it as a link, youtube, reddit,
 * or article .json item file in the root of the library folder.
 */
export async function addLinkItemToLibrary(
  source: LibrarySource,
  url: string
): Promise<LinkUploadItem> {
  const root = getLibraryDirectory(source);
  if (!root.exists) {
    root.create({ intermediates: true, idempotent: true });
  }

  const metadata = await resolveUrlMetadata(url);
  const id = generateId();
  const now = new Date().toISOString();

  let item: LinkUploadItem;
  switch (metadata.type) {
    case 'youtube':
      item = {
        id,
        version: SCHEMA_VERSION,
        type: 'youtube',
        url: metadata.url,
        title: metadata.title,
        thumbnail: metadata.thumbnail,
        createdAt: now,
        updatedAt: now,
      };
      break;
    case 'reddit':
      item = {
        id,
        version: SCHEMA_VERSION,
        type: 'reddit',
        url: metadata.url,
        subreddit: metadata.subreddit,
        subredditAvatar: metadata.subredditAvatar,
        title: metadata.title,
        ...(metadata.text ? { text: metadata.text } : {}),
        ...(metadata.image ? { image: metadata.image } : {}),
        createdAt: now,
        updatedAt: now,
      };
      break;
    case 'article':
      item = {
        id,
        version: SCHEMA_VERSION,
        type: 'article',
        url: metadata.url,
        title: metadata.title,
        origin: metadata.origin,
        thumbnail: metadata.thumbnail,
        createdAt: now,
        updatedAt: now,
      };
      break;
    case 'link':
      item = {
        id,
        version: SCHEMA_VERSION,
        type: 'link',
        url: metadata.url,
        siteTitle: metadata.siteTitle,
        description: metadata.description,
        favicon: metadata.favicon,
        createdAt: now,
        updatedAt: now,
      };
      break;
  }

  const jsonFile = new File(root, `${id}.json`);
  if (!jsonFile.exists) {
    jsonFile.create({ intermediates: true, overwrite: true });
  }
  jsonFile.write(JSON.stringify(item, null, 2));

  return item;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
