import { useEffect } from 'react';
import { act, render, waitFor } from '@testing-library/react-native';
import { LibraryProvider, useLibrary } from '@/hooks/useLibrary';
import { loadLibrary, setRelatedItemsInLibrary } from '@/lib/library/storage';
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
