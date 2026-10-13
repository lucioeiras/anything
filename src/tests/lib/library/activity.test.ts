import {
  getLibraryActivity,
  getMonthlyCompletions,
  localDayKey,
  matchesAddedDay,
  parseDayKey,
} from '@/lib/library/activity';
import type { BookItem, LibraryItem } from '@/lib/library/types';
const note = (createdAt: string): LibraryItem => ({
  id: createdAt,
  version: 1,
  type: 'note',
  text: 'test',
  createdAt,
  updatedAt: createdAt,
});
const book = (completedAt?: string): BookItem => ({
  ...note('2026-01-01'),
  type: 'book',
  isbn: '123',
  title: 'Book',
  authors: [],
  progressStatus: 'completed',
  completedAt,
});

it('summarizes current cards and ignores invalid temporal data', () => {
  const items = [
    note('bad'),
    note(new Date(2026, 1, 1).toISOString()),
    note(new Date(2026, 1, 1, 12).toISOString()),
    book(),
  ];
  const result = getLibraryActivity(items, 2026);
  expect(result).toMatchObject({
    total: 4,
    completed: 1,
    activeDays: 2,
    byType: { note: 3, book: 1 },
  });
  expect(result.byDay['2026-02-01']).toBe(2);
  expect(result.firstSaved).toEqual(new Date('2026-01-01'));
  expect(getLibraryActivity([], 2026)).toMatchObject({ total: 0, firstSaved: null, years: [2026] });
});
it('validates day keys, including leap years and invalid URL parameters', () => {
  expect(parseDayKey('2024-02-29')).not.toBeNull();
  for (const value of [
    '2026-02-29',
    '2026-02-31',
    '2026-13-01',
    '2026-00-01',
    '2026-1-1',
    '',
    ['2026-01-01'],
  ])
    expect(parseDayKey(value)).toBeNull();
});
it('filters by local day on either side of midnight and year boundaries', () => {
  const day = '2026-01-01';
  expect(matchesAddedDay(note(new Date(2026, 0, 1, 0).toISOString()), day)).toBe(true);
  expect(matchesAddedDay(note(new Date(2026, 0, 1, 23, 59).toISOString()), day)).toBe(true);
  expect(matchesAddedDay(note(new Date(2025, 11, 31, 23, 59).toISOString()), day)).toBe(false);
  expect(matchesAddedDay(note('invalid'), day)).toBe(false);
  expect(localDayKey(new Date(2024, 1, 29))).toBe('2024-02-29');
});
it('aggregates completions by local month, year, and type without estimating legacy dates', () => {
  const items = [
    book(new Date(2025, 11, 31, 23).toISOString()),
    book(new Date(2026, 0, 1).toISOString()),
    book(),
    book('invalid'),
    { ...book(new Date(2026, 1, 1).toISOString()), progressStatus: 'in-progress' as const },
    {
      ...book(new Date(2026, 1, 1).toISOString()),
      type: 'article' as const,
      progressStatus: 'completed' as const,
      url: 'https://example.com',
      origin: 'Example',
      thumbnail: 'https://example.com/image',
    },
  ];
  expect(getMonthlyCompletions(items, 2026, null)).toEqual({
    months: [[items[1]], [items[5]], ...Array.from({ length: 10 }, () => [])],
    undated: 2,
  });
  expect(getMonthlyCompletions(items, 2026, 'book').months[1].length).toBe(0);
  expect(getMonthlyCompletions(items, 2025, 'article')).toEqual({
    months: Array.from({ length: 12 }, () => []),
    undated: 0,
  });
  expect(getLibraryActivity(items, 2026).years).toEqual([2026, 2025]);
});

it('keeps the completed cards in chronological order within each month', () => {
  const early = { ...book(new Date(2026, 2, 1, 12).toISOString()), id: 'early' };
  const late = { ...book(new Date(2026, 2, 31, 12).toISOString()), id: 'late' };
  const result = getMonthlyCompletions([late, early], 2026, null);
  expect(result.months[2]).toEqual([early, late]);
  expect(result.months).toHaveLength(12);
});
