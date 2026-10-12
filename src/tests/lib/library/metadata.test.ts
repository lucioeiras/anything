import {
  calcAspectRatio,
  cleanRedditDescription,
  decodeHtmlEntities,
  resolveUrlMetadata,
} from '@/lib/library/metadata';

describe('metadata helpers', () => {
  it('resolves TikTok links to video metadata and falls back when oEmbed fails', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        title: 'A TikTok clip',
        thumbnail_url: 'https://example.com/cover.jpg',
      }),
    } as Response);
    await expect(
      resolveUrlMetadata('https://www.tiktok.com/@person/video/123')
    ).resolves.toMatchObject({
      type: 'tiktok',
      title: 'A TikTok clip',
      thumbnail: 'https://example.com/cover.jpg',
    });

    fetchMock.mockRejectedValueOnce(new Error('offline'));
    await expect(resolveUrlMetadata('https://vm.tiktok.com/short')).resolves.toMatchObject({
      type: 'tiktok',
      title: 'TikTok Video',
      thumbnail: '',
    });
    fetchMock.mockRestore();
  });

  it('calculates only valid positive aspect ratios', () => {
    expect(calcAspectRatio(1920, 1080)).toBeCloseTo(16 / 9);
    expect(calcAspectRatio(0, 10)).toBeUndefined();
    expect(calcAspectRatio(10, undefined)).toBeUndefined();
  });

  it('decodes HTML entities', () => {
    expect(decodeHtmlEntities('Tom &amp; Jerry')).toBe('Tom & Jerry');
    expect(decodeHtmlEntities('')).toBe('');
  });

  it('removes Reddit counters and drops empty boilerplate', () => {
    expect(cleanRedditDescription('107 votos, 38 comentários. Texto útil')).toBe('Texto útil');
    expect(cleanRedditDescription('12 comments')).toBeUndefined();
    expect(cleanRedditDescription('')).toBeUndefined();
  });
});
