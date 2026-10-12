import { formatDuration, formatReleaseYear, getHighResArtwork } from '@/lib/music/itunes';

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
