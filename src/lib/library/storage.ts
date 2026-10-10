import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';

import { parseItem } from './parse';
import { resolveUrlMetadata } from './metadata';
import {
  clearSourceCache,
  getAllCachedItems,
  getCachedMtimes,
  removeCachedItems,
  upsertCachedItems,
} from './cache';
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
  type TweetItem,
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

export function getSourceId(source: LibrarySource): string {
  return source.kind === 'local' ? 'local' : source.uri;
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
    clearSourceCache(id);
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
 * Reads every `*.json` file at the root of the library folder, using an expo-sqlite
 * cache indexed by file modification time (`lastModified`).
 * Only files that are newly added or whose modification time changed are read from disk.
 * Unchanged files are served instantaneously from SQLite.
 */
export async function loadLibrary(source: LibrarySource): Promise<LoadResult> {
  const root = getLibraryDirectory(source);
  const sourceId = getSourceId(source);

  if (!root.exists) {
    if (source.kind === 'local') root.create({ intermediates: true, idempotent: true });
    removeCachedItems(sourceId, Array.from(getCachedMtimes(sourceId).keys()));
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

  const cachedMtimes = getCachedMtimes(sourceId);
  const currentDiskIds = new Set<string>();

  type FileToRead = {
    file: File;
    id: string;
    mtime: number;
  };

  const filesToRead: FileToRead[] = [];

  for (const file of jsonFiles) {
    const fileName = file.name;
    const id = fileName.slice(0, -5); // strip .json
    currentDiskIds.add(id);

    // Get file modification time
    let mtime = 0;
    try {
      mtime =
        file.lastModified ??
        (file as unknown as { modificationTime?: number }).modificationTime ??
        0;
    } catch {
      mtime = 0;
    }

    const cachedMtime = cachedMtimes.get(id);
    if (cachedMtime === undefined || cachedMtime !== mtime) {
      filesToRead.push({ file, id, mtime });
    }
  }

  // Find files that were removed from disk and purge them from cache
  const deletedIds: string[] = [];
  for (const cachedId of cachedMtimes.keys()) {
    if (!currentDiskIds.has(cachedId)) {
      deletedIds.push(cachedId);
    }
  }
  if (deletedIds.length > 0) {
    removeCachedItems(sourceId, deletedIds);
  }

  // Read only changed / new files from disk
  const issues: LoadIssue[] = [];
  if (filesToRead.length > 0) {
    const readResults = await Promise.allSettled(
      filesToRead.map(async ({ file, id, mtime }) => {
        const rawJson = await file.text();
        const parsed = parseItem(JSON.parse(rawJson));
        return { id, mtime, rawJson, item: parsed };
      })
    );

    const entriesToUpsert: {
      id: string;
      mtime: number;
      rawJson: string;
      item: LibraryItem;
    }[] = [];

    readResults.forEach((result, i) => {
      const { file, id } = filesToRead[i];
      if (result.status === 'fulfilled') {
        entriesToUpsert.push(result.value);
      } else {
        issues.push({ file: file.name, reason: errorMessage(result.reason) });
        // If file could not be parsed, remove any stale cached entry
        removeCachedItems(sourceId, [id]);
      }
    });

    if (entriesToUpsert.length > 0) {
      upsertCachedItems(sourceId, entriesToUpsert);
    }
  }

  // Load all items from SQLite cache
  const { items: cachedItems, corruptIds } = getAllCachedItems(sourceId);
  if (corruptIds.length > 0) {
    removeCachedItems(sourceId, corruptIds);
  }

  // Resolve image references relative to this library's root
  const items = cachedItems.map((item) => resolveImages(item, root));

  return { items, issues, pendingDownloads };
}

/** Turns `images/foo.jpg` into an absolute `file://` URI; leaves URLs untouched. */
export function resolveImageRef(ref: ImageRef, root: Directory): string {
  if (/^(https?:|data:|file:)/i.test(ref)) return ref;
  const relative = ref.replace(/^\.?\//, '');
  return new File(root, relative).uri;
}

export function resolveImages(item: LibraryItem, root: Directory): LibraryItem {
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
      return {
        ...item,
        avatar: r(item.avatar),
        images: item.images?.map(r),
        video: item.video
          ? {
              ...item.video,
              thumbnail: item.video.thumbnail ? r(item.video.thumbnail) : undefined,
            }
          : undefined,
      };
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

export type AddImageOptions = {
  title?: string;
  note?: string;
  tags?: string[];
};

/**
 * Copies a picked image into the library's `images/` folder and writes the
 * corresponding `<id>.json` metadata file to the root of the library.
 */
export async function addImageToLibrary(
  source: LibrarySource,
  asset: PickedImageAsset,
  options?: AddImageOptions
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
  const trimmedTitle = options?.title?.trim();
  const trimmedNote = options?.note?.trim();
  const tags = options?.tags?.filter(Boolean);

  const item: ImageItem = {
    id,
    version: SCHEMA_VERSION,
    type: 'image',
    image: relativeImagePath,
    ...(trimmedTitle ? { title: trimmedTitle } : {}),
    ...(trimmedNote ? { note: trimmedNote } : {}),
    ...(tags && tags.length > 0 ? { tags } : {}),
    createdAt: now,
    updatedAt: now,
  };

  const jsonFile = new File(root, `${id}.json`);
  if (!jsonFile.exists) {
    jsonFile.create({ intermediates: true, overwrite: true });
  }
  const jsonText = JSON.stringify(item, null, 2);
  jsonFile.write(jsonText);

  // Update SQLite cache immediately with modification time
  const mtime =
    jsonFile.lastModified ??
    (jsonFile as unknown as { modificationTime?: number }).modificationTime ??
    Date.now();
  upsertCachedItems(getSourceId(source), [{ id, mtime, rawJson: jsonText, item }]);

  return item;
}

/**
 * Creates a note or quote item file in the root of the library folder.
 * Automatically verifies if the text is a quote (starts and ends with ") or a note.
 */
export async function addTextItemToLibrary(
  source: LibrarySource,
  rawText: string,
  title?: string,
  options?: { tags?: string[] }
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
    ...(options?.tags && options.tags.length > 0 ? { tags: options.tags } : {}),
    createdAt: now,
    updatedAt: now,
  };

  const jsonFile = new File(root, `${id}.json`);
  if (!jsonFile.exists) {
    jsonFile.create({ intermediates: true, overwrite: true });
  }
  const jsonText = JSON.stringify(item, null, 2);
  jsonFile.write(jsonText);

  // Update SQLite cache immediately with modification time
  const mtime =
    jsonFile.lastModified ??
    (jsonFile as unknown as { modificationTime?: number }).modificationTime ??
    Date.now();
  upsertCachedItems(getSourceId(source), [{ id, mtime, rawJson: jsonText, item }]);

  return item;
}

export type LinkUploadItem = LinkItem | ArticleItem | YouTubeItem | RedditItem | TweetItem;

/**
 * Loads metadata for the given URL and saves it as a link, youtube, reddit,
 * tweet, or article .json item file in the root of the library folder.
 */
export async function addLinkItemToLibrary(
  source: LibrarySource,
  url: string,
  options?: { tags?: string[]; note?: string }
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
    case 'tweet':
      item = {
        id,
        version: SCHEMA_VERSION,
        type: 'tweet',
        url: metadata.url,
        author: metadata.author,
        avatar: metadata.avatar,
        text: metadata.text,
        ...(metadata.images?.length ? { images: metadata.images } : {}),
        ...(metadata.video ? { video: metadata.video } : {}),
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

  if (options?.tags?.length) {
    item.tags = options.tags;
  }
  if (options?.note) {
    item.note = options.note;
  }

  const jsonFile = new File(root, `${id}.json`);
  if (!jsonFile.exists) {
    jsonFile.create({ intermediates: true, overwrite: true });
  }
  const jsonText = JSON.stringify(item, null, 2);
  jsonFile.write(jsonText);

  // Update SQLite cache immediately with modification time
  const mtime =
    jsonFile.lastModified ??
    (jsonFile as unknown as { modificationTime?: number }).modificationTime ??
    Date.now();
  upsertCachedItems(getSourceId(source), [{ id, mtime, rawJson: jsonText, item }]);

  return item;
}

export type DeletedImageBackup = {
  fileName: string;
  bytes: Uint8Array;
};

export type DeletedItemBackup = {
  id: string;
  jsonText: string;
  images?: DeletedImageBackup[];
};

function extractImageRefsFromItem(item: unknown): string[] {
  if (!item || typeof item !== 'object') return [];
  const rec = item as Record<string, unknown>;
  const refs: string[] = [];

  const add = (val: unknown) => {
    if (typeof val === 'string' && val.trim().length > 0) {
      refs.push(val.trim());
    }
  };

  add(rec.image);
  add(rec.favicon);
  add(rec.thumbnail);
  add(rec.avatar);
  add(rec.subredditAvatar);

  if (Array.isArray(rec.images)) {
    for (const img of rec.images) {
      add(img);
    }
  }

  return refs;
}

function getItemImageFileNames(
  parsed: Record<string, unknown>,
  availableImageFiles: File[],
  imagesDirUri: string
): Set<string> {
  const result = new Set<string>();
  const refs = extractImageRefsFromItem(parsed);
  const normalizedImagesDir = imagesDirUri.replace(/\/+$/, '');

  for (const ref of refs) {
    if (/^(https?:|data:)/i.test(ref)) continue;

    const clean = ref.split('?')[0].split('#')[0];

    // If it's a file URI inside imagesDir
    if (clean.startsWith('file:') && clean.startsWith(normalizedImagesDir + '/')) {
      const fileName = decodeURIComponent(clean.slice(normalizedImagesDir.length + 1));
      result.add(fileName);
      continue;
    }

    // Relative path like "images/xyz.jpg" or "./images/xyz.jpg"
    const relative = clean.replace(/^\.?\//, '');
    if (relative.startsWith(`${IMAGES_DIR}/`)) {
      const fileName = decodeURIComponent(relative.slice(IMAGES_DIR.length + 1));
      result.add(fileName);
      continue;
    }

    // Direct filename match in imagesDir
    const directMatch = availableImageFiles.find((f) => f.name === relative || f.name === clean);
    if (directMatch) {
      result.add(directMatch.name);
    }
  }

  // Check if any file in imagesDir starts with `${parsed.id}.` (e.g. `<id>.jpg`)
  if (typeof parsed.id === 'string' && parsed.id) {
    const idPrefix = `${parsed.id}.`;
    for (const f of availableImageFiles) {
      if (f.name.startsWith(idPrefix)) {
        result.add(f.name);
      }
    }
  }

  return result;
}

/**
 * Deletes multiple cards from the library and returns backups of their JSON contents
 * (and any deleted image files) so they can be restored if needed.
 */
export async function deleteItemsFromLibrary(
  source: LibrarySource,
  itemIds: string[]
): Promise<DeletedItemBackup[]> {
  const root = getLibraryDirectory(source);
  if (!root.exists || itemIds.length === 0) return [];

  const idSet = new Set(itemIds);
  const backups: DeletedItemBackup[] = [];
  const entries = root.list();

  const jsonFiles: File[] = [];
  for (const entry of entries) {
    if (
      entry instanceof File &&
      entry.name.toLowerCase().endsWith('.json') &&
      !entry.name.startsWith('.')
    ) {
      jsonFiles.push(entry);
    }
  }

  type ParsedEntry = {
    file: File;
    text: string;
    parsed: Record<string, unknown>;
  };

  const toDelete: ParsedEntry[] = [];
  const toRetain: ParsedEntry[] = [];

  for (const file of jsonFiles) {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed.id === 'string') {
        if (idSet.has(parsed.id)) {
          toDelete.push({ file, text, parsed });
        } else {
          toRetain.push({ file, text, parsed });
        }
      }
    } catch {
      // ignore JSON parse error
    }
  }

  const imagesDir = getImagesDirectory(source);
  const availableImageFiles: File[] = [];
  const imageFileByName = new Map<string, File>();

  if (imagesDir.exists) {
    try {
      const imgEntries = imagesDir.list();
      for (const entry of imgEntries) {
        if (entry instanceof File && !entry.name.startsWith('.')) {
          availableImageFiles.push(entry);
          imageFileByName.set(entry.name, entry);
        }
      }
    } catch (e) {
      console.warn('Failed to list images directory:', e);
    }
  }

  // Collect image file names retained by remaining items so we never delete an image used by another card
  const retainedImageFileNames = new Set<string>();
  for (const item of toRetain) {
    const fileNames = getItemImageFileNames(item.parsed, availableImageFiles, imagesDir.uri);
    for (const name of fileNames) {
      retainedImageFileNames.add(name);
    }
  }

  // Track already deleted/backed-up image files to handle multiple cards referencing the same file
  const processedImages = new Set<string>();

  for (const item of toDelete) {
    const itemImageFileNames = getItemImageFileNames(
      item.parsed,
      availableImageFiles,
      imagesDir.uri
    );
    const itemImageBackups: DeletedImageBackup[] = [];

    for (const fileName of itemImageFileNames) {
      if (retainedImageFileNames.has(fileName)) {
        // Still referenced by another card that is not being deleted
        continue;
      }

      const imageFile = imageFileByName.get(fileName);
      if (imageFile && imageFile.exists) {
        // Read image bytes for backup if not already processed
        if (!processedImages.has(fileName)) {
          try {
            const bytes = await imageFile.bytes();
            itemImageBackups.push({ fileName, bytes });
          } catch {
            try {
              const buffer = await imageFile.arrayBuffer();
              itemImageBackups.push({ fileName, bytes: new Uint8Array(buffer) });
            } catch (e) {
              console.warn(`Failed to read image ${fileName} for backup:`, e);
            }
          }

          // Delete the image file from images/
          try {
            imageFile.delete();
          } catch (e) {
            console.warn(`Failed to delete image file ${fileName}:`, e);
          }

          processedImages.add(fileName);
        }
      }
    }

    // Delete the card's JSON file
    try {
      item.file.delete();
    } catch (e) {
      console.warn(`Failed to delete JSON file ${item.file.name}:`, e);
    }

    backups.push({
      id: item.parsed.id as string,
      jsonText: item.text,
      ...(itemImageBackups.length > 0 ? { images: itemImageBackups } : {}),
    });
  }

  // Remove deleted items from SQLite cache
  removeCachedItems(
    getSourceId(source),
    toDelete.map((i) => i.parsed.id as string)
  );

  return backups;
}

/**
 * Restores previously deleted items to the library folder from their backup JSON
 * and restores any associated images.
 */
export async function restoreItemsToLibrary(
  source: LibrarySource,
  backups: DeletedItemBackup[]
): Promise<void> {
  const root = getLibraryDirectory(source);
  if (!root.exists || backups.length === 0) return;

  const imagesDir = getImagesDirectory(source);

  for (const backup of backups) {
    try {
      const jsonFile = new File(root, `${backup.id}.json`);
      if (!jsonFile.exists) {
        jsonFile.create({ intermediates: true, overwrite: true });
      }
      const jsonText = backup.jsonText;
      jsonFile.write(jsonText);

      // Restore to SQLite cache
      try {
        const parsed = parseItem(JSON.parse(jsonText));
        const mtime =
          jsonFile.lastModified ??
          (jsonFile as unknown as { modificationTime?: number }).modificationTime ??
          Date.now();
        upsertCachedItems(getSourceId(source), [
          { id: backup.id, mtime, rawJson: jsonText, item: parsed },
        ]);
      } catch (cacheErr) {
        console.warn(`Failed to cache restored item ${backup.id}:`, cacheErr);
      }

      if (backup.images && backup.images.length > 0) {
        if (!imagesDir.exists) {
          imagesDir.create({ intermediates: true, idempotent: true });
        }
        for (const img of backup.images) {
          try {
            const restoredImageFile = new File(imagesDir, img.fileName);
            if (!restoredImageFile.exists) {
              restoredImageFile.create({ intermediates: true, overwrite: true });
            }
            restoredImageFile.write(img.bytes);
          } catch (imgErr) {
            console.error(`Failed to restore image ${img.fileName}:`, imgErr);
          }
        }
      }
    } catch (e) {
      console.error(`Failed to restore item ${backup.id}:`, e);
    }
  }
}

/**
 * Deletes a single card's JSON file and related image from the library folder.
 */
export async function deleteItemFromLibrary(source: LibrarySource, itemId: string): Promise<void> {
  await deleteItemsFromLibrary(source, [itemId]);
}

/**
 * Updates an existing card's JSON file in the library folder and returns the resolved item.
 */
export async function updateItemInLibrary(
  source: LibrarySource,
  itemId: string,
  updates: Partial<LibraryItem>
): Promise<LibraryItem> {
  const root = getLibraryDirectory(source);
  if (!root.exists) {
    throw new Error('Library directory not found');
  }

  const jsonFile = new File(root, `${itemId}.json`);
  if (!jsonFile.exists) {
    throw new Error(`Card ${itemId} not found`);
  }

  const text = await jsonFile.text();
  const rawItem = JSON.parse(text);

  const now = new Date().toISOString();
  const updatedRaw = {
    ...rawItem,
    ...updates,
    id: itemId,
    updatedAt: now,
  };

  if (
    rawItem.image &&
    typeof rawItem.image === 'string' &&
    !rawItem.image.startsWith('file:') &&
    !rawItem.image.startsWith('http')
  ) {
    updatedRaw.image = rawItem.image;
  }
  if (
    rawItem.thumbnail &&
    typeof rawItem.thumbnail === 'string' &&
    !rawItem.thumbnail.startsWith('file:') &&
    !rawItem.thumbnail.startsWith('http')
  ) {
    updatedRaw.thumbnail = rawItem.thumbnail;
  }
  if (
    rawItem.favicon &&
    typeof rawItem.favicon === 'string' &&
    !rawItem.favicon.startsWith('file:') &&
    !rawItem.favicon.startsWith('http')
  ) {
    updatedRaw.favicon = rawItem.favicon;
  }

  if (updates.tags) {
    updatedRaw.tags = updates.tags.filter(Boolean);
  }

  const jsonText = JSON.stringify(updatedRaw, null, 2);
  jsonFile.write(jsonText);

  // Update SQLite cache
  const mtime =
    jsonFile.lastModified ??
    (jsonFile as unknown as { modificationTime?: number }).modificationTime ??
    Date.now();
  const resolvedItem = resolveImages(parseItem(updatedRaw), root);
  upsertCachedItems(getSourceId(source), [
    { id: itemId, mtime, rawJson: jsonText, item: parseItem(updatedRaw) },
  ]);

  return resolvedItem;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
