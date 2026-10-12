import { localDateKey, monthFromKey } from '@/components/books/bookLogDates';

describe('book log date helpers', () => {
  it('formats dates using the local calendar fields', () => {
    expect(localDateKey(new Date(2024, 0, 9, 23, 59))).toBe('2024-01-09');
  });

  it('returns the first day of the month represented by a key', () => {
    expect(monthFromKey('2024-02-29')).toEqual(new Date(2024, 1, 1));
  });
});
