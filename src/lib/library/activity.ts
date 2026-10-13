import { ITEM_TYPES, type LibraryItem, type LibraryItemType } from './types';

export const TRACKABLE_TYPES = ['book', 'movie', 'game', 'article', 'youtube'] as const;
export type TrackableType = (typeof TRACKABLE_TYPES)[number];

export const CARD_TYPE_LABELS: Record<LibraryItemType, string> = {
  note: 'Notes',
  quote: 'Quotes',
  image: 'Media',
  pdf: 'PDFs',
  video: 'Videos',
  audio: 'Recorded audio',
  link: 'Links',
  article: 'Articles',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  tweet: 'Tweets',
  reddit: 'Reddit',
  book: 'Books',
  music: 'Music',
  movie: 'Movies',
  game: 'Games',
};

export function validDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const day = value.match(/^(\d{4}-\d{2}-\d{2})(?:T|$)/)?.[1];
  if (day && !parseDayKey(day)) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function localDayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function parseDayKey(value: unknown): Date | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return localDayKey(date) === value ? date : null;
}

export function matchesAddedDay(item: LibraryItem, day: string): boolean {
  const date = validDate(item.createdAt);
  return !!date && localDayKey(date) === day;
}

export function getLibraryActivity(items: LibraryItem[], currentYear: number) {
  const byDay: Record<string, number> = {};
  const byType = Object.fromEntries(ITEM_TYPES.map((type) => [type, 0])) as Record<
    LibraryItemType,
    number
  >;
  let firstSaved: Date | null = null;
  let completed = 0;
  const years = new Set([currentYear]);
  for (const item of items) {
    byType[item.type]++;
    const created = validDate(item.createdAt);
    if (created) {
      const key = localDayKey(created);
      byDay[key] = (byDay[key] ?? 0) + 1;
      if (!firstSaved || created < firstSaved) firstSaved = created;
    }
    if ('progressStatus' in item && item.progressStatus === 'completed') {
      completed++;
      const date = validDate(item.completedAt);
      if (date) years.add(date.getFullYear());
    }
  }
  return {
    total: items.length,
    firstSaved,
    completed,
    byDay,
    byType,
    activeDays: Object.keys(byDay).length,
    years: [...years].sort((a, b) => b - a),
  };
}

export function getMonthlyCompletions(
  items: LibraryItem[],
  year: number,
  type: TrackableType | null
) {
  const buckets = Array.from(
    { length: 12 },
    () => [] as { item: LibraryItem; timestamp: number }[]
  );
  let undated = 0;
  for (const item of items) {
    if (type && item.type !== type) continue;
    if (!('progressStatus' in item) || item.progressStatus !== 'completed') continue;
    const date = validDate(item.completedAt);
    if (!date) undated++;
    else if (date.getFullYear() === year) {
      buckets[date.getMonth()].push({ item, timestamp: date.getTime() });
    }
  }
  const months = buckets.map((bucket) =>
    bucket
      .sort((a, b) => a.timestamp - b.timestamp || a.item.id.localeCompare(b.item.id))
      .map(({ item }) => item)
  );
  return { months, undated };
}
