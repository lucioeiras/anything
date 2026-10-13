import { setRelatedItemsInLibrary } from '@/lib/library/storage';
import { clearSourceCache, upsertCachedItems } from '@/lib/library/cache';

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
    async text() {
      return mockFiles.get(this.name);
    }
    write(text: string) {
      if (mockWriteFailure?.(this.name, text)) throw new Error('write failed');
      mockFiles.set(this.name, text);
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
const makeItem = (id: string, relatedItemIds?: string[]) => ({
  id,
  type: 'note',
  text: `Note ${id}`,
  version: 1,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  ...(relatedItemIds ? { relatedItemIds } : {}),
  tags: ['keep'],
  customField: 'preserve',
});
const put = (id: string, related?: string[]) =>
  mockFiles.set(`${id}.json`, JSON.stringify(makeItem(id, related)));
const read = (id: string) => JSON.parse(mockFiles.get(`${id}.json`)!);

beforeEach(() => {
  mockFiles.clear();
  mockWriteFailure = undefined;
  jest.clearAllMocks();
  put('a');
  put('b', ['c']);
  put('c', ['b']);
});

it('adds both directions without changing unrelated relationships or fields', async () => {
  await setRelatedItemsInLibrary(source, 'a', ['a', 'b', 'b']);
  expect(read('a')).toMatchObject({
    relatedItemIds: ['b'],
    tags: ['keep'],
    customField: 'preserve',
  });
  expect(read('b').relatedItemIds).toEqual(['c', 'a']);
  expect(read('c').relatedItemIds).toEqual(['b']);
  expect(upsertCachedItems).toHaveBeenCalledTimes(1);
});

it('removes from either end, including asymmetric incoming relationships', async () => {
  put('a', ['b']);
  await setRelatedItemsInLibrary(source, 'b', ['c']);
  expect(read('a').relatedItemIds).toBeUndefined();
  expect(read('b').relatedItemIds).toEqual(['c']);
});

it('clears all existing relationships but preserves references to deleted cards', async () => {
  put('a', ['b', 'deleted']);
  put('b', ['c', 'a']);
  await setRelatedItemsInLibrary(source, 'a', []);
  expect(read('a').relatedItemIds).toEqual(['deleted']);
  expect(read('b').relatedItemIds).toEqual(['c']);
});

it('rejects missing selected/current cards before writing and skips malformed unrelated files', async () => {
  mockFiles.set('broken.json', '{');
  await expect(setRelatedItemsInLibrary(source, 'a', ['missing'])).rejects.toThrow(
    'no longer available'
  );
  await expect(setRelatedItemsInLibrary(source, 'missing', [])).rejects.toThrow('Card not found');
  expect(read('a').relatedItemIds).toBeUndefined();
  await setRelatedItemsInLibrary(source, 'a', ['b']);
  expect(read('b').relatedItemIds).toContain('a');
});

it('restores original JSON and invalidates cache if a later write fails', async () => {
  const before = new Map(mockFiles);
  mockWriteFailure = (name, text) => name === 'b.json' && text.includes('"a"');
  await expect(setRelatedItemsInLibrary(source, 'a', ['b'])).rejects.toThrow('Please try again');
  expect(mockFiles).toEqual(before);
  expect(clearSourceCache).toHaveBeenCalledWith('local');
  expect(upsertCachedItems).not.toHaveBeenCalled();
});

it('reports restoration failure, and allows a subsequent retry', async () => {
  mockWriteFailure = (name) => name === 'b.json';
  await expect(setRelatedItemsInLibrary(source, 'a', ['b'])).rejects.toThrow(
    'restore every change'
  );
  mockWriteFailure = undefined;
  await setRelatedItemsInLibrary(source, 'a', ['b']);
  expect(read('a').relatedItemIds).toEqual(['b']);
  expect(read('b').relatedItemIds).toContain('a');
});

it('rolls back if cache update fails', async () => {
  const before = new Map(mockFiles);
  jest.mocked(upsertCachedItems).mockImplementationOnce(() => {
    throw new Error('cache');
  });
  await expect(setRelatedItemsInLibrary(source, 'a', ['b'])).rejects.toThrow('Please try again');
  expect(mockFiles).toEqual(before);
});

it('serializes overlapping relation edits using fresh on-disk values', async () => {
  await Promise.all([
    setRelatedItemsInLibrary(source, 'a', ['b']),
    setRelatedItemsInLibrary(source, 'b', ['c']),
  ]);
  expect(read('a').relatedItemIds).toBeUndefined();
  expect(read('b').relatedItemIds).toEqual(['c']);
  expect(read('c').relatedItemIds).toEqual(['b']);
});
