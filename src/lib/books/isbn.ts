import { decodeHTML } from 'entities';

export type BookMetadata = {
  isbn: string;
  title: string;
  authors: string[];
  cover?: string;
  coverAspectRatio?: number;
  description?: string;
  publisher?: string;
  publishedDate?: string;
  pageCount?: number;
  url?: string;
};

/**
 * Normalizes an ISBN string by stripping hyphens, spaces, and converting to uppercase.
 */
export function normalizeIsbn(raw: string): string {
  return raw.trim().replace(/[-\s]/g, '').toUpperCase();
}

/**
 * Checks whether an ISBN has a valid format (ISBN-10 or ISBN-13).
 */
export function isValidIsbn(isbn: string): boolean {
  const clean = normalizeIsbn(isbn);
  // ISBN-10: 9 digits followed by a digit or 'X'
  const isbn10Regex = /^[0-9]{9}[0-9X]$/;
  // ISBN-13: 13 digits, typically starting with 978 or 979
  const isbn13Regex = /^[0-9]{13}$/;
  return isbn10Regex.test(clean) || isbn13Regex.test(clean);
}

function cleanDescription(desc?: string): string | undefined {
  if (!desc) return undefined;
  // Remove HTML tags that sometimes appear in Google Books descriptions
  const stripped = desc.replace(/<[^>]*>/g, '').trim();
  return stripped ? decodeHTML(stripped) : undefined;
}

function cleanHttpsUrl(url?: string): string | undefined {
  if (!url) return undefined;
  let secure = url.trim();
  if (secure.startsWith('http://')) {
    secure = 'https://' + secure.slice(7);
  }
  return secure;
}

/**
 * Fetches book details from Google Books API.
 */
async function fetchFromGoogleBooks(cleanIsbn: string): Promise<BookMetadata | null> {
  const endpoint = `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`;
  const response = await fetch(endpoint);
  if (!response.ok) return null;

  const data = await response.json();
  if (!data || !data.items || data.items.length === 0) return null;

  const item = data.items[0];
  const info = item.volumeInfo || {};

  const title = info.title ? decodeHTML(info.title.trim()) : '';
  if (!title) return null;

  const subtitle = info.subtitle ? decodeHTML(info.subtitle.trim()) : '';
  const fullTitle = subtitle ? `${title}: ${subtitle}` : title;

  const authors: string[] = Array.isArray(info.authors)
    ? info.authors.map((a: string) => decodeHTML(String(a).trim())).filter(Boolean)
    : [];

  const rawCover =
    info.imageLinks?.extraLarge ||
    info.imageLinks?.large ||
    info.imageLinks?.medium ||
    info.imageLinks?.thumbnail ||
    info.imageLinks?.smallThumbnail;

  const cover = cleanHttpsUrl(rawCover);

  return {
    isbn: cleanIsbn,
    title: fullTitle,
    authors,
    cover,
    description: cleanDescription(info.description),
    publisher: info.publisher ? decodeHTML(info.publisher.trim()) : undefined,
    publishedDate: info.publishedDate?.trim(),
    pageCount:
      typeof info.pageCount === 'number' && info.pageCount > 0 ? info.pageCount : undefined,
    url: cleanHttpsUrl(info.infoLink || info.canonicalVolumeLink),
  };
}

/**
 * Fetches book details from Open Library API.
 */
async function fetchFromOpenLibrary(cleanIsbn: string): Promise<BookMetadata | null> {
  const bibkey = `ISBN:${cleanIsbn}`;
  const endpoint = `https://openlibrary.org/api/books?bibkeys=${bibkey}&jscmd=data&format=json`;
  const response = await fetch(endpoint);
  if (!response.ok) return null;

  const data = await response.json();
  if (!data || !data[bibkey]) return null;

  const info = data[bibkey];
  const title = info.title ? decodeHTML(info.title.trim()) : '';
  if (!title) return null;

  const subtitle = info.subtitle ? decodeHTML(info.subtitle.trim()) : '';
  const fullTitle = subtitle ? `${title}: ${subtitle}` : title;

  const authors: string[] = Array.isArray(info.authors)
    ? info.authors
        .map((a: { name?: string }) => decodeHTML(String(a.name || '').trim()))
        .filter(Boolean)
    : [];

  const publisher =
    Array.isArray(info.publishers) && info.publishers.length > 0 && info.publishers[0].name
      ? decodeHTML(String(info.publishers[0].name).trim())
      : undefined;

  const rawCover =
    info.cover?.large ||
    info.cover?.medium ||
    info.cover?.small ||
    `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg`;

  const cover = cleanHttpsUrl(rawCover);

  let description: string | undefined;
  if (typeof info.description === 'string') {
    description = cleanDescription(info.description);
  } else if (info.description && typeof info.description.value === 'string') {
    description = cleanDescription(info.description.value);
  } else if (Array.isArray(info.excerpts) && info.excerpts.length > 0 && info.excerpts[0].text) {
    description = cleanDescription(info.excerpts[0].text);
  }

  return {
    isbn: cleanIsbn,
    title: fullTitle,
    authors,
    cover,
    description,
    publisher,
    publishedDate: info.publish_date ? String(info.publish_date).trim() : undefined,
    pageCount:
      typeof info.number_of_pages === 'number' && info.number_of_pages > 0
        ? info.number_of_pages
        : undefined,
    url: cleanHttpsUrl(info.url),
  };
}

/**
 * Fetches book details from BrasilAPI (specialized in Brazilian books and CBL registry).
 */
async function fetchFromBrasilApi(cleanIsbn: string): Promise<BookMetadata | null> {
  const endpoint = `https://brasilapi.com.br/api/isbn/v1/${cleanIsbn}`;
  const response = await fetch(endpoint);
  if (!response.ok) return null;

  const data = await response.json();
  if (!data || !data.title) return null;

  const title = decodeHTML(data.title.trim());
  const subtitle = data.subtitle ? decodeHTML(data.subtitle.trim()) : '';
  const fullTitle = subtitle ? `${title}: ${subtitle}` : title;

  const authors: string[] = Array.isArray(data.authors)
    ? data.authors.map((a: string) => decodeHTML(String(a).trim())).filter(Boolean)
    : [];

  return {
    isbn: cleanIsbn,
    title: fullTitle,
    authors,
    cover: cleanHttpsUrl(data.cover_url),
    description: cleanDescription(data.synopsis),
    publisher: data.publisher ? decodeHTML(data.publisher.trim()) : undefined,
    publishedDate: data.year ? String(data.year).trim() : undefined,
    pageCount:
      typeof data.page_count === 'number' && data.page_count > 0 ? data.page_count : undefined,
  };
}

/**
 * Searches for book metadata by ISBN using a cascading strategy:
 * 1. Google Books API (global, rich descriptions & authors)
 * 2. Open Library API (Internet Archive open catalog)
 * 3. BrasilAPI (Brazilian ISBN registry)
 *
 * Throws a descriptive error if the book could not be found.
 */
export async function fetchBookByIsbn(rawIsbn: string): Promise<BookMetadata> {
  const cleanIsbn = normalizeIsbn(rawIsbn);

  if (!cleanIsbn) {
    throw new Error('Please enter an ISBN.');
  }

  if (cleanIsbn.length < 9 || cleanIsbn.length > 17) {
    throw new Error('Invalid ISBN format. Please enter a valid 10 or 13 digit ISBN.');
  }

  // 1. Try Google Books
  try {
    const googleResult = await fetchFromGoogleBooks(cleanIsbn);
    if (googleResult) {
      // If Google Books returned data but no cover image, check if Open Library has a cover
      if (!googleResult.cover) {
        googleResult.cover = `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg`;
      }
      return googleResult;
    }
  } catch (e) {
    console.warn('Google Books fetch failed:', e);
  }

  // 2. Try Open Library
  try {
    const openLibResult = await fetchFromOpenLibrary(cleanIsbn);
    if (openLibResult) {
      return openLibResult;
    }
  } catch (e) {
    console.warn('Open Library fetch failed:', e);
  }

  // 3. Try BrasilAPI
  try {
    const brasilResult = await fetchFromBrasilApi(cleanIsbn);
    if (brasilResult) {
      return brasilResult;
    }
  } catch (e) {
    console.warn('BrasilAPI fetch failed:', e);
  }

  throw new Error(`Could not find book with ISBN ${rawIsbn}. Please check the number.`);
}
