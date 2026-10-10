import { decodeHTML } from 'entities';

export type RawgPlatform = {
  platform: {
    id: number;
    name: string;
    slug: string;
  };
};

export type RawgGenre = {
  id: number;
  name: string;
  slug: string;
};

export type RawgGameResult = {
  id: number;
  name: string;
  slug: string;
  released: string | null;
  background_image: string | null;
  rating: number;
  metacritic: number | null;
  platforms?: RawgPlatform[];
  genres?: RawgGenre[];
  short_screenshots?: { id: number; image: string }[];
};

export type RawgGameDetails = {
  id: number;
  name: string;
  description_raw?: string;
  description?: string;
  released: string | null;
  background_image: string | null;
  background_image_additional?: string | null;
  website?: string | null;
  rating: number;
  metacritic: number | null;
  platforms?: RawgPlatform[];
  genres?: RawgGenre[];
  developers?: { id: number; name: string }[];
  publishers?: { id: number; name: string }[];
  esrb_rating?: { id: number; name: string } | null;
};

/**
 * Returns the RAWG API key configured in the environment (.env).
 */
export function getRawgApiKey(): string | null {
  const envKey = process.env.EXPO_PUBLIC_RAWG_API_KEY;
  if (envKey && envKey.trim()) {
    return envKey.trim();
  }
  return null;
}

/**
 * Extracts release year (e.g. "2023") from release date string ("2023-10-20").
 */
export function extractReleaseYear(released?: string | null): string {
  if (!released) return '';
  const match = released.match(/^\d{4}/);
  return match ? match[0] : '';
}

/**
 * Strips HTML tags and unescapes entities from RAWG descriptions.
 */
export function cleanRawgDescription(desc?: string | null): string {
  if (!desc) return '';
  const stripped = desc.replace(/<[^>]*>/g, '').trim();
  return stripped ? decodeHTML(stripped) : '';
}

/**
 * Searches the RAWG database for games matching query.
 */
export async function searchRawgGames(query: string, pageSize = 20): Promise<RawgGameResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const apiKey = getRawgApiKey();
  if (!apiKey) {
    throw new Error('RAWG API key is not configured (EXPO_PUBLIC_RAWG_API_KEY).');
  }

  const encodedQuery = encodeURIComponent(trimmed);
  const endpoint = `https://api.rawg.io/api/games?search=${encodedQuery}&key=${apiKey}&page_size=${pageSize}`;

  const response = await fetch(endpoint, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Invalid RAWG API key or unauthorized.');
    }
    throw new Error(`RAWG search failed with status ${response.status}.`);
  }

  const data = await response.json();
  if (!data || !Array.isArray(data.results)) {
    return [];
  }

  return data.results.map((item: any) => ({
    id: item.id,
    name: decodeHTML(item.name || ''),
    slug: item.slug || '',
    released: item.released || null,
    background_image: item.background_image || null,
    rating: typeof item.rating === 'number' ? item.rating : 0,
    metacritic: typeof item.metacritic === 'number' ? item.metacritic : null,
    platforms: item.platforms || [],
    genres: (item.genres || []).map((g: any) => ({
      ...g,
      name: decodeHTML(g.name || ''),
    })),
    short_screenshots: item.short_screenshots || [],
  }));
}

/**
 * Fetches detailed info for a single game from RAWG.
 */
export async function getRawgGameDetails(id: number): Promise<RawgGameDetails> {
  const apiKey = getRawgApiKey();
  if (!apiKey) {
    throw new Error('RAWG API key is not configured (EXPO_PUBLIC_RAWG_API_KEY).');
  }

  const endpoint = `https://api.rawg.io/api/games/${id}?key=${apiKey}`;
  const response = await fetch(endpoint, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch game details (HTTP ${response.status}).`);
  }

  const data = await response.json();
  return {
    id: data.id,
    name: decodeHTML(data.name || ''),
    description_raw: data.description_raw || cleanRawgDescription(data.description),
    description: cleanRawgDescription(data.description),
    released: data.released || null,
    background_image: data.background_image || null,
    background_image_additional: data.background_image_additional || null,
    website: data.website || null,
    rating: typeof data.rating === 'number' ? data.rating : 0,
    metacritic: typeof data.metacritic === 'number' ? data.metacritic : null,
    platforms: data.platforms || [],
    genres: (data.genres || []).map((g: any) => ({
      ...g,
      name: decodeHTML(g.name || ''),
    })),
    developers: (data.developers || []).map((d: any) => ({
      ...d,
      name: decodeHTML(d.name || ''),
    })),
    publishers: (data.publishers || []).map((p: any) => ({
      ...p,
      name: decodeHTML(p.name || ''),
    })),
    esrb_rating: data.esrb_rating || null,
  };
}
