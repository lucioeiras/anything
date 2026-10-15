import { fetchBookByIsbn } from '@/lib/books/isbn';

describe('Google Books language selection', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it.each(['en', 'pt'] as const)('filters the ISBN lookup to %s', async (language) => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [{ volumeInfo: { title: 'Title', authors: [] } }],
      }),
    });

    await expect(fetchBookByIsbn('9780132350884', language)).resolves.toMatchObject({
      title: 'Title',
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`langRestrict=${language}`)
    );
  });
});
