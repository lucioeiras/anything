import { updateItemInLibrary, updateItemsInLibrary } from '@/lib/library/storage';
import { parseItem } from '@/lib/library/parse';
const mockFiles = new Map<string, string>();
let mockWriteFailure: ((name: string, text: string) => boolean) | undefined;

jest.mock('@react-native-async-storage/async-storage', () => ({}));
jest.mock('@/lib/library/metadata', () => ({}));
jest.mock('@/lib/library/cache', () => ({
  upsertCachedItems: jest.fn(),
  clearSourceCache: jest.fn(),
}));
jest.mock('expo-file-system', () => {
  class File {
    name: string;
    lastModified = 100;
    constructor(...parts: unknown[]) {
      this.name = String(parts[parts.length - 1]);
    }
    get exists() {
      return mockFiles.has(this.name);
    }
    async text() {
      return mockFiles.get(this.name);
    }
    write(text: string) {
      if (mockWriteFailure?.(this.name, text)) throw new Error('write failed');
      mockFiles.set(this.name, text);
    }
    delete() {
      mockFiles.delete(this.name);
    }
  }
  return {
    File,
    Paths: { document: 'file:///library' },
    Directory: class {
      exists = true;
      uri = 'file:///library';
      list() {
        return [...mockFiles.keys()].map((name) => new File(name));
      }
    },
  };
});

const source = { kind: 'local' as const };
const original = {
  id: 'book',
  type: 'book',
  title: 'Book',
  isbn: '123',
  authors: [],
  version: 1,
  createdAt: '2026-01-01T12:00:00.000Z',
  updatedAt: '2026-01-01T12:00:00.000Z',
  progressStatus: 'want',
};
const read = () => JSON.parse(mockFiles.get('book.json')!);
beforeEach(() => {
  mockFiles.clear();
  mockFiles.set('book.json', JSON.stringify(original));
  jest.useFakeTimers().setSystemTime(new Date('2026-02-01T12:00:00.000Z'));
});
afterEach(() => jest.useRealTimers());
it('persists completion, keeps it across edits, clears it when reopened, and timestamps recompletion', async () => {
  await updateItemInLibrary(source, 'book', { progressStatus: 'completed' });
  expect(read().completedAt).toBe('2026-02-01T12:00:00.000Z');
  jest.setSystemTime(new Date('2026-03-01T12:00:00.000Z'));
  await updateItemInLibrary(source, 'book', { note: 'review' });
  expect(read().completedAt).toBe('2026-02-01T12:00:00.000Z');
  await updateItemInLibrary(source, 'book', { progressStatus: 'in-progress' });
  expect(read().completedAt).toBeUndefined();
  await updateItemInLibrary(source, 'book', { progressStatus: 'completed' });
  expect(read().completedAt).toBe('2026-03-01T12:00:00.000Z');
});
it('records automatic reading-log completion in the same update', async () => {
  await updateItemInLibrary(source, 'book', {
    progressStatus: 'completed',
    readingLogs: [
      { id: 'log', page: 100, date: '2026-02-01', createdAt: '2026-02-01T12:00:00.000Z' },
    ],
  });
  expect(read().completedAt).toBe('2026-02-01T12:00:00.000Z');
  expect(read().readingLogs).toHaveLength(1);
});
it('leaves legacy completed cards undated when edited', async () => {
  mockFiles.set('book.json', JSON.stringify({ ...original, progressStatus: 'completed' }));
  await updateItemInLibrary(source, 'book', { note: 'edit' });
  expect(read().completedAt).toBeUndefined();
});
it('preserves valid completion dates and discards malformed or incompatible ones', () => {
  const completed = { ...original, progressStatus: 'completed' };
  expect(parseItem({ ...completed, completedAt: '2026-02-01T12:00:00.000Z' })).toHaveProperty(
    'completedAt'
  );
  for (const completedAt of [42, '', 'invalid', '2026-02-31T12:00:00.000Z', '2026-02-01'])
    expect(parseItem({ ...completed, completedAt })).not.toHaveProperty('completedAt');
  expect(parseItem({ ...original, completedAt: '2026-02-01T12:00:00.000Z' })).not.toHaveProperty(
    'completedAt'
  );
});
it('rejects missing cards without changing the existing JSON', async () => {
  await expect(
    updateItemInLibrary(source, 'missing', { progressStatus: 'completed' })
  ).rejects.toThrow('not found');
  expect(read()).toEqual(original);
});

it('rolls back earlier card writes when a later batch update fails', async () => {
  const second = { ...original, id: 'second', title: 'Second' };
  mockFiles.set('second.json', JSON.stringify(second));
  const before = new Map(mockFiles);
  mockWriteFailure = (name, text) => name === 'second.json' && text.includes('pinnedAt');

  await expect(
    updateItemsInLibrary(source, [
      { itemId: 'book', updates: { pinnedAt: '2026-02-01T12:00:00.000Z' } },
      { itemId: 'second', updates: { pinnedAt: '2026-02-01T12:00:00.001Z' } },
    ])
  ).rejects.toThrow('Could not save all card updates');

  expect(mockFiles).toEqual(before);
});
