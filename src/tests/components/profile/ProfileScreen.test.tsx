import { fireEvent, render, screen } from '@testing-library/react-native';
import ProfileScreen from '@/app/(tabs)/profile';
import { localDayKey } from '@/lib/library/activity';
import type { LibraryItem } from '@/lib/library/types';
import type { LibraryState } from '@/hooks/useLibrary';

const mockNavigate = jest.fn(),
  mockPush = jest.fn(),
  mockSearch = jest.fn(),
  mockClearTag = jest.fn(),
  mockRefresh = jest.fn();
let mockState: LibraryState;
jest.mock('expo-router', () => ({
  router: {
    navigate: (...args: unknown[]) => mockNavigate(...args),
    push: (...args: unknown[]) => mockPush(...args),
  },
}));
jest.mock('@/hooks/useLibrary', () => ({
  useLibrary: () => ({
    state: mockState,
    currentFolderName: 'Test library',
    setSearchQuery: mockSearch,
    clearSearchTag: mockClearTag,
    refresh: mockRefresh,
  }),
}));
jest.mock('@/components/Button', () => ({
  Button: ({
    accessibilityLabel,
    onPress,
  }: {
    accessibilityLabel: string;
    onPress: () => void;
  }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pressable, Text } = require('react-native');
    return (
      <Pressable accessibilityLabel={accessibilityLabel} onPress={onPress}>
        <Text>{accessibilityLabel}</Text>
      </Pressable>
    );
  },
}));
const createdAt = new Date().toISOString();
const note: LibraryItem = {
  id: 'note',
  type: 'note',
  version: 1,
  text: 'test',
  createdAt,
  updatedAt: createdAt,
};
const ready = (items: LibraryItem[]) => {
  mockState = { status: 'ready', result: { items, issues: [], pendingDownloads: 0 } };
};
beforeEach(() => {
  jest.clearAllMocks();
  ready([note]);
});
it('shows current-library stats and opens settings', async () => {
  await render(<ProfileScreen />);
  expect(screen.getByText('Test library')).toBeTruthy();
  expect(screen.getByText('Saved cards')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Settings'));
  expect(mockPush).toHaveBeenCalledWith('/settings');
});
it('opens a calendar day on the board and resets previous filters', async () => {
  await render(<ProfileScreen />);
  await fireEvent.press(screen.getByLabelText(/, 1 cards added$/));
  expect(mockSearch).toHaveBeenCalledWith('');
  expect(mockClearTag).toHaveBeenCalled();
  expect(mockNavigate).toHaveBeenCalledWith({
    pathname: '/board',
    params: {
      addedOn: localDayKey(new Date(createdAt)),
      activityToken: expect.any(String),
      folderKind: '',
      folderKey: '',
    },
  });
});
it('updates chart counts by year and type, with a notice for undated cards', async () => {
  const year = new Date().getFullYear();
  const book: LibraryItem = {
    ...note,
    id: 'book',
    type: 'book',
    title: 'Book',
    isbn: '123',
    authors: [],
    progressStatus: 'completed',
    completedAt: new Date(year - 1, 0, 15, 12).toISOString(),
  };
  ready([book, { ...book, id: 'legacy', completedAt: undefined }]);
  await render(<ProfileScreen />);
  expect(screen.getByText(/1 completed card\(s\) have no completion date/)).toBeTruthy();
  await fireEvent.press(screen.getByLabelText(`Year: ${year}`));
  await fireEvent.press(screen.getByLabelText(String(year - 1)));
  expect(screen.getByLabelText(`January ${year - 1}: 1 cards completed`)).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Movies'));
  expect(screen.getByLabelText(`January ${year - 1}: 0 cards completed`)).toBeTruthy();
  expect(screen.queryByText(/have no completion date/)).toBeNull();
  expect(screen.getByLabelText('Movies').props.accessibilityState.selected).toBe(true);
  await fireEvent.press(screen.getByLabelText('Movies'));
  expect(screen.queryByLabelText('All types')).toBeNull();
  expect(screen.getByLabelText('Movies').props.accessibilityState.selected).toBe(false);
  expect(screen.getByLabelText(`January ${year - 1}: 1 cards completed`)).toBeTruthy();
});
it('handles loading, errors, retry, and an empty library', async () => {
  mockState = { status: 'loading' };
  const view = await render(<ProfileScreen />);
  expect(screen.getByLabelText('Loading profile')).toBeTruthy();
  mockState = { status: 'error', error: 'test' };
  await view.rerender(<ProfileScreen />);
  await fireEvent.press(screen.getByLabelText('Retry loading library'));
  expect(mockRefresh).toHaveBeenCalled();
  ready([]);
  await view.rerender(<ProfileScreen />);
  expect(screen.getByText('Save your first card to start your library activity.')).toBeTruthy();
});
it('refreshes stats when the loaded library changes', async () => {
  const view = await render(<ProfileScreen />);
  ready([]);
  await view.rerender(<ProfileScreen />);
  expect(screen.getByText('First card saved')).toBeTruthy();
  expect(screen.getByText('—')).toBeTruthy();
});
