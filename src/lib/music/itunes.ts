import { decodeHTML } from 'entities';

export type MusicMetadata = {
  id: number;
  kind: 'song' | 'album';
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

/** Searches the iTunes catalog for songs or albums matching a query. */
export async function searchITunesMusic(
  query: string,
  kind: 'song' | 'album' = 'song',
  limit = 25
): Promise<MusicMetadata[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const encoded = encodeURIComponent(cleanQuery);
  const endpoint = `https://itunes.apple.com/search?term=${encoded}&entity=${kind}&limit=${limit}`;

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
      .filter((item: any) =>
        kind === 'album'
          ? item?.wrapperType === 'collection' && typeof item.collectionId === 'number'
          : item?.kind === 'song' && typeof item.trackId === 'number'
      )
      .map((item: any): MusicMetadata => {
        const title = decodeHTML(
          kind === 'album'
            ? item.collectionName || item.collectionCensoredName || 'Unknown Album'
            : item.trackName || item.trackCensoredName || 'Unknown Title'
        );
        const artist = decodeHTML(item.artistName || 'Unknown Artist');
        const album =
          kind === 'song' && item.collectionName ? decodeHTML(item.collectionName) : undefined;
        const rawCover = item.artworkUrl100 || item.artworkUrl60 || item.artworkUrl30 || '';
        const cover = getHighResArtwork(rawCover, 600);

        return {
          id: kind === 'album' ? item.collectionId : item.trackId,
          kind,
          title,
          artist,
          album,
          cover,
          previewUrl: kind === 'song' ? item.previewUrl || undefined : undefined,
          externalUrl:
            kind === 'album' ? item.collectionViewUrl || undefined : item.trackViewUrl || undefined,
          durationMs:
            kind === 'song' && typeof item.trackTimeMillis === 'number'
              ? item.trackTimeMillis
              : undefined,
          releaseDate: item.releaseDate || undefined,
          genre: item.primaryGenreName ? decodeHTML(item.primaryGenreName) : undefined,
        };
      })
      .filter((item: MusicMetadata) =>
        item.kind === 'album' ? !item.title.toLowerCase().includes(' - single') : true
      );
  } catch (error) {
    console.warn('Failed to search iTunes music:', error);
    return [];
  }
}
