import {
  formatDuration,
  formatReleaseYear,
  getHighResArtwork,
  getITunesCountry,
  searchITunesMusic,
} from '@/lib/music/itunes';

describe('iTunes metadata formatting', () => {
  it('upscales artwork URLs and handles missing artwork', () => {
    expect(getHighResArtwork('https://cdn.test/100x100bb.jpg')).toBe(
      'https://cdn.test/600x600bb.jpg'
    );
    expect(getHighResArtwork(undefined)).toBe('');
  });

  it('formats durations and handles invalid values', () => {
    expect(formatDuration(215000)).toBe('3:35');
    expect(formatDuration(5000)).toBe('0:05');
    expect(formatDuration(0)).toBe('');
    expect(formatDuration(Number.NaN)).toBe('');
  });

  it('extracts release years and handles empty or invalid dates', () => {
    expect(formatReleaseYear('2024-03-11T00:00:00Z')).toBe('2024');
    expect(formatReleaseYear(undefined)).toBe('');
    expect(formatReleaseYear('not a date')).toBe('');
  });
});

describe('iTunes metadata locale', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('maps app languages to the matching storefront country', () => {
    expect(getITunesCountry('pt')).toBe('BR');
    expect(getITunesCountry('en')).toBe('US');
  });

  it('queries the requested storefront and preserves provider metadata', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [{ kind: 'song', trackId: 7, trackName: 'Canção' }] }),
    });

    await expect(searchITunesMusic('canção', 'song', 5, 'BR')).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ title: 'Canção' })])
    );
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('country=BR'),
      expect.anything()
    );
  });
});
