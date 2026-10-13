import { getReadingActivity } from '@/lib/library/readingActivity';
import type { BookItem, LibraryItem } from '@/lib/library/types';
const today = new Date(2026, 11, 31);
function book(id: string, days: string[]): BookItem {
  return {
    id,
    type: 'book',
    version: 1,
    title: id,
    isbn: id,
    authors: [],
    createdAt: '',
    updatedAt: '',
    readingLogs: days.map((date, index) => ({
      id: String(index),
      date,
      page: index + 1,
      createdAt: '2026-12-31T12:00:00Z',
    })),
  };
}
it('groups distinct books by log date, regardless of status and log creation time', () => {
  const a = book('a', ['2026-01-01', '2026-01-01']);
  const b = { ...book('b', ['2026-01-01']), progressStatus: 'abandoned' as const };
  const note: LibraryItem = {
    id: 'note',
    type: 'note',
    version: 1,
    text: 'note',
    createdAt: '',
    updatedAt: '',
  };
  const result = getReadingActivity([a, b, note], 2026, today);
  expect(result.byDay['2026-01-01']).toEqual([a, b]);
  expect(result.readingDays).toBe(1);
  expect(result.bestStreak).toBe(1);
});
it('highlights all days in the longest streak and every tied streak', () => {
  const result = getReadingActivity(
    [
      book('a', [
        '2026-01-01',
        '2026-01-02',
        '2026-01-03',
        '2026-02-01',
        '2026-02-02',
        '2026-02-03',
        '2026-03-01',
      ]),
    ],
    2026,
    today
  );
  expect(result.bestStreak).toBe(3);
  expect([...result.bestStreakDays]).toEqual([
    '2026-01-01',
    '2026-01-02',
    '2026-01-03',
    '2026-02-01',
    '2026-02-02',
    '2026-02-03',
  ]);
});
it('joins runs across months, excludes other years, and validates leap days', () => {
  const result = getReadingActivity(
    [
      book('a', [
        '2025-12-31',
        '2026-01-01',
        '2026-01-31',
        '2026-02-01',
        '2026-02-29',
        '2026-02-31',
        'bad',
        '2027-01-01',
      ]),
    ],
    2026,
    today
  );
  expect(result.bestStreak).toBe(2);
  expect([...result.bestStreakDays]).toEqual(['2026-01-31', '2026-02-01']);
  const leap = getReadingActivity(
    [book('b', ['2024-02-28', '2024-02-29', '2024-03-01'])],
    2024,
    today
  );
  expect(leap.bestStreak).toBe(3);
});
it('counts consecutive calendar dates over daylight saving transitions', () => {
  const result = getReadingActivity(
    [book('a', ['2026-03-07', '2026-03-08', '2026-03-09'])],
    2026,
    today
  );
  expect(result.bestStreak).toBe(3);
});
it('returns an empty state and excludes logs in the future', () => {
  const result = getReadingActivity([book('a', ['2026-10-14'])], 2026, new Date(2026, 9, 13));
  expect(result).toEqual({ byDay: {}, bestStreak: 0, bestStreakDays: new Set(), readingDays: 0 });
  expect(getReadingActivity([], 2026, today).bestStreak).toBe(0);
});
