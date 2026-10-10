import { decodeHTML } from 'entities';

export type MusicMetadata = {
  trackId: number;
  title: string;
  artist: string;
  album?: string;
  cover: string;
  previewUrl?: string;
  externalUrl?: string;
  durationMs?: number;
  releaseDate?: string;
  genre?: string;
};

/**
 * Replaces low-resolution iTunes artwork dimensions with high-resolution dimensions.
 */
export function getHighResArtwork(url?: string, size = 600): string {
  if (!url) return '';
  return url.replace(/\b100x100bb\b/i, `${size}x${size}bb`);
}

/**
 * Formats duration in milliseconds to mm:ss format.
 */
export function formatDuration(durationMs?: number): string {
  if (!durationMs || isNaN(durationMs) || durationMs <= 0) return '';
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Extracts year from an ISO release date string.
 */
export function formatReleaseYear(dateString?: string): string {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (!isNaN(d.getFullYear())) {
      return d.getFullYear().toString();
    }
  } catch {
    // fallback
  }
  const match = dateString.match(/\b\d{4}\b/);
  return match ? match[0] : '';
}

/**
 * Searches the iTunes Search API for songs matching a query.
 */
export async function searchITunesMusic(query: string, limit = 25): Promise<MusicMetadata[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const encoded = encodeURIComponent(cleanQuery);
  const endpoint = `https://itunes.apple.com/search?term=${encoded}&entity=song&limit=${limit}`;

  try {
    const response = await fetch(endpoint, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`iTunes search failed with status ${response.status}`);
    }

    const data = await response.json();
    if (!data || !Array.isArray(data.results)) {
      return [];
    }

    return data.results
      .filter((item: any) => item && (item.kind === 'song' || item.wrapperType === 'track'))
      .map((item: any): MusicMetadata => {
        const title = decodeHTML(item.trackName || item.trackCensoredName || 'Unknown Title');
        const artist = decodeHTML(item.artistName || 'Unknown Artist');
        const album = item.collectionName ? decodeHTML(item.collectionName) : undefined;
        const rawCover = item.artworkUrl100 || item.artworkUrl60 || item.artworkUrl30 || '';
        const cover = getHighResArtwork(rawCover, 600);

        return {
          trackId: item.trackId,
          title,
          artist,
          album,
          cover,
          previewUrl: item.previewUrl || undefined,
          externalUrl: item.trackViewUrl || item.collectionViewUrl || undefined,
          durationMs: typeof item.trackTimeMillis === 'number' ? item.trackTimeMillis : undefined,
          releaseDate: item.releaseDate || undefined,
          genre: item.primaryGenreName ? decodeHTML(item.primaryGenreName) : undefined,
        };
      });
  } catch (error) {
    console.warn('Failed to search iTunes music:', error);
    return [];
  }
}
