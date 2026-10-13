import { useEffect } from 'react';
import { act, render, waitFor } from '@testing-library/react-native';
import { LibraryProvider, useLibrary } from '@/hooks/useLibrary';
import { loadLibrary, setRelatedItemsInLibrary, updateItemInLibrary } from '@/lib/library/storage';
import type { LibraryItem } from '@/lib/library/types';

jest.mock('@react-native-async-storage/async-storage', () => ({}));
jest.mock('@/lib/library/cache', () => ({}));
jest.mock('@/lib/library/storage', () => ({
  getSavedLibrarySource: jest.fn().mockResolvedValue({ kind: 'local' }),
  getRecentFolders: jest.fn().mockResolvedValue([]),
  resolveFolderSource: (source: unknown) => source,
  getSourceId: () => 'local',
  getLibraryDirectory: () => ({ exists: false }),
  getFolderDisplayName: () => 'Library',
  loadLibrary: jest.fn(),
  updateItemInLibrary: jest.fn(),
  setRelatedItemsInLibrary: jest.fn(),
}));
const a: LibraryItem = {
  id: 'a',
  type: 'note',
  text: 'Alpha',
  version: 1,
  createdAt: '',
  updatedAt: '',
};
const b: LibraryItem = { ...a, id: 'b', text: 'Beta' };
const result = (items: LibraryItem[]) => ({ items, issues: [], pendingDownloads: 0 });
let library: ReturnType<typeof useLibrary>;
function Consumer() {
  const value = useLibrary();
  useEffect(() => {
    library = value;
  }, [value]);
  return null;
}
const open = async () => {
  await render(
    <LibraryProvider>
      <Consumer />
    </LibraryProvider>
  );
  await waitFor(() => expect(library.state.status).toBe('ready'));
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(loadLibrary).mockResolvedValue(result([a, b]));
});

it('publishes both changed cards together after persistence succeeds', async () => {
  jest.mocked(setRelatedItemsInLibrary).mockResolvedValue([
    { ...a, relatedItemIds: ['b'] },
    { ...b, relatedItemIds: ['a'] },
  ]);
  await open();
  await act(async () => {
    await library.setRelatedItems('a', ['b']);
  });
  expect(setRelatedItemsInLibrary).toHaveBeenCalledWith({ kind: 'local' }, 'a', ['b']);
  expect(library.state).toMatchObject({
    status: 'ready',
    result: {
      items: [
        { id: 'a', relatedItemIds: ['b'] },
        { id: 'b', relatedItemIds: ['a'] },
      ],
    },
  });
  expect(loadLibrary).toHaveBeenCalledTimes(1);
});

it('reloads actual disk state and rejects when persistence fails', async () => {
  jest.mocked(setRelatedItemsInLibrary).mockRejectedValueOnce(new Error('save failed'));
  await open();
  jest.mocked(loadLibrary).mockResolvedValueOnce(result([{ ...a, relatedItemIds: ['b'] }, b]));
  await act(async () => {
    await expect(library.setRelatedItems('a', ['b'])).rejects.toThrow('save failed');
  });
  expect(loadLibrary).toHaveBeenCalledTimes(2);
  expect(library.state).toMatchObject({
    status: 'ready',
    result: { items: [{ id: 'a', relatedItemIds: ['b'] }, { id: 'b' }] },
  });
});

it('publishes a batch of item updates together after persistence succeeds', async () => {
  jest.mocked(updateItemInLibrary).mockImplementation(
    async (_source, itemId, updates) =>
      ({
        ...(itemId === 'a' ? a : b),
        ...updates,
      }) as LibraryItem
  );
  await open();

  await act(async () => {
    await library.updateItems([
      { itemId: 'a', updates: { pinnedAt: '2026-01-01T00:00:00.000Z' } },
      { itemId: 'b', updates: { pinnedAt: '2026-01-01T00:00:00.001Z' } },
    ]);
  });

  expect(updateItemInLibrary).toHaveBeenCalledTimes(2);
  expect(library.state).toMatchObject({
    status: 'ready',
    result: {
      items: [
        { id: 'a', pinnedAt: '2026-01-01T00:00:00.000Z' },
        { id: 'b', pinnedAt: '2026-01-01T00:00:00.001Z' },
      ],
    },
  });
});

it('puts newly pinned cards first and preserves the existing pinned order', async () => {
  const existingPinned = { ...a, pinnedAt: '2026-01-01T00:00:00.000Z' };
  jest.mocked(loadLibrary).mockResolvedValue(result([existingPinned, b]));
  jest
    .mocked(updateItemInLibrary)
    .mockImplementation(
      async (_source, itemId, updates) =>
        ({ ...(itemId === 'a' ? existingPinned : b), ...updates }) as LibraryItem
    );
  await open();

  await act(async () => {
    await expect(library.setItemsPinned(['b'], true)).resolves.toBe(true);
  });

  const persistedPinnedAt = jest.mocked(updateItemInLibrary).mock.calls.map((call) => ({
    itemId: call[1],
    pinnedAt: call[2].pinnedAt,
  }));
  expect(persistedPinnedAt.map(({ itemId }) => itemId)).toEqual(['b', 'a']);
  expect(Date.parse(persistedPinnedAt[0].pinnedAt!)).toBeLessThan(
    Date.parse(persistedPinnedAt[1].pinnedAt!)
  );
  expect(library.state).toMatchObject({
    status: 'ready',
    result: {
      items: [
        { id: 'a', pinnedAt: persistedPinnedAt[1].pinnedAt },
        { id: 'b', pinnedAt: persistedPinnedAt[0].pinnedAt },
      ],
    },
  });
});
