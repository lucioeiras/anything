import { getTmdbTvShowDetails, searchTmdbTvShows } from '@/lib/movies/tmdb';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue('test-key'),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('TMDB TV show requests', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('searches TV shows and returns results', async () => {
    const results = [{ id: 42, name: 'Show', poster_path: '/poster.jpg' }];
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ results }) });
    await expect(searchTmdbTvShows('  Show  ')).resolves.toEqual(results);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/search/tv?query=Show'),
      expect.objectContaining({ headers: expect.objectContaining({ Accept: 'application/json' }) })
    );
  });

  it('fetches show details including all listed seasons', async () => {
    const details = {
      id: 42,
      name: 'Show',
      seasons: [
        { id: 1, season_number: 0 },
        { id: 2, season_number: 1 },
      ],
    };
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => details });
    await expect(getTmdbTvShowDetails(42)).resolves.toEqual(details);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/tv/42?language=en-US'),
      expect.anything()
    );
  });

  it('returns an empty result for blank searches without contacting TMDB', async () => {
    globalThis.fetch = jest.fn();
    await expect(searchTmdbTvShows('  ')).resolves.toEqual([]);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
