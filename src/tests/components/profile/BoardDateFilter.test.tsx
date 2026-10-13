import { fireEvent, render, screen } from '@testing-library/react-native';
import { useEffect as mockUseEffect } from 'react';
import { Text as MockText, View as MockView } from 'react-native';
import BoardScreen from '@/app/(tabs)/board';
import type { LibraryItem } from '@/lib/library/types';

let mockParams: Record<string, string> = {};
const mockSetParams = jest.fn();
const mockOverlay = jest.fn();
let mockQuery = '';
let mockTag: string | null = null;
const mockSetQuery = jest.fn();
const mockClearTag = jest.fn();
const mockItems: LibraryItem[] = [
  {
    id: 'today',
    type: 'note',
    version: 1,
    text: 'Today note',
    tags: ['keep'],
    createdAt: new Date(2026, 9, 13, 12).toISOString(),
    updatedAt: '',
  },
  {
    id: 'yesterday',
    type: 'note',
    version: 1,
    text: 'Yesterday note',
    createdAt: new Date(2026, 9, 12, 12).toISOString(),
    updatedAt: '',
  },
];
jest.mock('expo-router', () => ({
  router: { setParams: (...args: unknown[]) => mockSetParams(...args) },
  useLocalSearchParams: () => mockParams,
  useFocusEffect: (callback: () => void) => mockUseEffect(callback, [callback]),
}));
jest.mock('@/hooks/useLibrary', () => ({
  useLibrary: () => ({
    state: { status: 'ready', result: { items: mockItems, issues: [], pendingDownloads: 0 } },
    searchQuery: mockQuery,
    searchTag: mockTag,
    searchType: null,
    setSearchQuery: mockSetQuery,
    clearSearchTag: mockClearTag,
    searchItems: ({ type, searchQuery }: { type?: string; searchQuery?: string }) =>
      mockItems.filter(
        (item) =>
          (!type || item.type === type) &&
          (!searchQuery || ('text' in item && (item.text ?? '').includes(searchQuery)))
      ),
  }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('@/components/menus/FloatingTabOverlay', () => ({
  useFloatingTabOverlay: () => mockOverlay,
}));
jest.mock('@shopify/flash-list', () => ({
  FlashList: ({ data, renderItem, ListHeaderComponent, ListEmptyComponent }: any) => (
    <MockView>
      <ListHeaderComponent />
      {data.length ? (
        data.map((item: LibraryItem) => (
          <MockView key={item.id}>{renderItem({ item, index: 0 })}</MockView>
        ))
      ) : (
        <ListEmptyComponent />
      )}
    </MockView>
  ),
}));
jest.mock('@/components/cards/ItemCard', () => ({
  ItemCard: ({ item }: { item: LibraryItem }) => (
    <MockText>{'text' in item ? item.text : item.id}</MockText>
  ),
}));
jest.mock('@/components/menus/CardSelectionBar', () => ({ CardSelectionBar: () => null }));
jest.mock('@/components/menus/RestoreToast', () => ({ RestoreToast: () => null }));
jest.mock('@/components/modals/AddToFolderModal', () => ({ AddToFolderModal: () => null }));
jest.mock('@/components/modals/NewAudioModal', () => ({ NewAudioModal: () => null }));
jest.mock('@/components/modals/NewBookModal', () => ({ NewBookModal: () => null }));
jest.mock('@/components/modals/NewEntertainmentModal', () => ({
  NewEntertainmentModal: () => null,
}));
jest.mock('@/components/modals/NewGameModal', () => ({ NewGameModal: () => null }));
jest.mock('@/components/modals/NewImageModal', () => ({ NewImageModal: () => null }));
jest.mock('@/components/modals/NewLinkModal', () => ({ NewLinkModal: () => null }));
jest.mock('@/components/modals/NewMovieModal', () => ({ NewMovieModal: () => null }));
jest.mock('@/components/modals/NewMusicModal', () => ({ NewMusicModal: () => null }));
jest.mock('@/components/modals/NewNoteModal', () => ({ NewNoteModal: () => null }));
jest.mock('@/components/modals/NewPdfModal', () => ({ NewPdfModal: () => null }));
jest.mock('@/components/modals/NewVideoModal', () => ({ NewVideoModal: () => null }));

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = { addedOn: '2026-10-13', activityToken: '1' };
  mockQuery = '';
  mockTag = null;
});
it('filters loaded cards by the selected day', async () => {
  await render(<BoardScreen />);
  expect(screen.getByText('Today note')).toBeTruthy();
  expect(screen.queryByText('Yesterday note')).toBeNull();
});
it('ignores invalid dates', async () => {
  mockParams.addedOn = '2026-02-31';
  await render(<BoardScreen />);
  expect(screen.getByText('Yesterday note')).toBeTruthy();
});
it('combines the day with text and tag filters and clears all filters from the empty state', async () => {
  mockQuery = 'Yesterday';
  mockTag = 'keep';
  await render(<BoardScreen />);
  expect(screen.getByText('No results found')).toBeTruthy();
  await fireEvent.press(screen.getByText('Clear filters'));
  expect(mockSetQuery).toHaveBeenCalledWith('');
  expect(mockClearTag).toHaveBeenCalled();
  expect(mockSetParams).toHaveBeenCalledWith({ addedOn: '' });
});
it('combines date and type filters and resets type when opening the day again', async () => {
  const view = await render(<BoardScreen />);
  await fireEvent.press(screen.getByText('Books'));
  expect(screen.getByText('No results found')).toBeTruthy();
  mockParams = { ...mockParams, activityToken: '2' };
  await view.rerender(<BoardScreen />);
  expect(screen.getByText('Today note')).toBeTruthy();
});

it('keeps the type filter when the date filter is removed', async () => {
  const view = await render(<BoardScreen />);
  await fireEvent.press(screen.getByText('Books'));
  mockParams = { ...mockParams, addedOn: '' };
  await view.rerender(<BoardScreen />);
  expect(screen.getByText('No results found')).toBeTruthy();
  expect(screen.queryByText('Today note')).toBeNull();
});
