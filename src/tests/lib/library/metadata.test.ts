import {
  calcAspectRatio,
  cleanRedditDescription,
  decodeHtmlEntities,
} from '@/lib/library/metadata';

describe('metadata helpers', () => {
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
