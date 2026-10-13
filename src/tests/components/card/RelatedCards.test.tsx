import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { RelatedCardsPicker } from '@/components/card/RelatedCardsPicker';
import { RelatedCardsSection } from '@/components/card/RelatedCardsSection';
import type { LibraryItem } from '@/lib/library/types';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 }),
}));
jest.mock('@/components/cards/ItemCard', () => ({ ItemCard: () => null }));
jest.mock('@shopify/flash-list', () => ({
  FlashList: ({ data, renderItem, ListEmptyComponent }: any) => {
    const { View } = jest.requireActual('react-native');
    return (
      <View>
        {data.length
          ? data.map((item: LibraryItem) => <View key={item.id}>{renderItem({ item })}</View>)
          : ListEmptyComponent}
      </View>
    );
  },
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
const c: LibraryItem = { ...a, id: 'c', text: 'Gamma' };
const items = [a, b, c];
const props = () => ({
  itemId: 'a',
  items,
  selectedIds: ['b'],
  searchItems: (query: string) =>
    items.filter((item) => item.type === 'note' && item.text.includes(query)),
  onSave: jest.fn().mockResolvedValue(undefined),
  onClose: jest.fn(),
});

it('starts checked, excludes itself and preserves selected cards across searches', async () => {
  const handlers = props();
  const screen = await render(<RelatedCardsPicker {...handlers} />);
  expect(screen.queryByLabelText('Alpha')).toBeNull();
  expect(screen.getByRole('checkbox', { name: 'Beta' }).props.accessibilityState.checked).toBe(
    true
  );
  await fireEvent.changeText(screen.getByLabelText('Search related cards'), 'Gamma');
  await fireEvent.press(screen.getByLabelText('Gamma'));
  await fireEvent.press(screen.getByLabelText('Save related cards'));
  await waitFor(() => expect(handlers.onSave).toHaveBeenCalledWith(['b', 'c']));
  expect(handlers.onClose).toHaveBeenCalledTimes(1);
});

it('deselects cards and can save an empty selection', async () => {
  const handlers = props();
  const screen = await render(<RelatedCardsPicker {...handlers} />);
  await fireEvent.press(screen.getByLabelText('Beta'));
  await fireEvent.press(screen.getByLabelText('Save related cards'));
  expect(handlers.onSave).toHaveBeenCalledWith([]);
});

it('cancels without writing and reopening uses saved selection', async () => {
  const handlers = props();
  const screen = await render(<RelatedCardsPicker {...handlers} />);
  await fireEvent.press(screen.getByLabelText('Gamma'));
  await fireEvent.press(screen.getByLabelText('Cancel related cards'));
  expect(handlers.onSave).not.toHaveBeenCalled();
  expect(handlers.onClose).toHaveBeenCalledTimes(1);
  await screen.unmount();
  const reopened = await render(<RelatedCardsPicker {...handlers} />);
  expect(reopened.getByLabelText('Gamma').props.accessibilityState.checked).toBe(false);
});

it('keeps draft and modal open after an error and allows retry', async () => {
  const handlers = props();
  handlers.onSave.mockRejectedValueOnce(new Error('Could not save'));
  const screen = await render(<RelatedCardsPicker {...handlers} />);
  await fireEvent.press(screen.getByLabelText('Gamma'));
  await fireEvent.press(screen.getByLabelText('Save related cards'));
  await waitFor(() => expect(screen.getByText('Could not save')).toBeTruthy());
  expect(handlers.onClose).not.toHaveBeenCalled();
  await screen.rerender(<RelatedCardsPicker {...handlers} selectedIds={[]} />);
  expect(screen.getByLabelText('Gamma').props.accessibilityState.checked).toBe(true);
  await fireEvent.press(screen.getByLabelText('Save related cards'));
  await waitFor(() => expect(handlers.onClose).toHaveBeenCalledTimes(1));
});

it('prevents duplicate saves, selection changes and closing during saving', async () => {
  let finish!: () => void;
  const handlers = props();
  handlers.onSave.mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      })
  );
  const screen = await render(<RelatedCardsPicker {...handlers} />);
  await fireEvent.press(screen.getByLabelText('Save related cards'));
  await fireEvent.press(screen.getByLabelText('Save related cards'));
  await fireEvent.press(screen.getByLabelText('Cancel related cards'));
  expect(handlers.onSave).toHaveBeenCalledTimes(1);
  expect(handlers.onClose).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Gamma').props.accessibilityState.disabled).toBe(true);
  finish();
  await waitFor(() => expect(handlers.onClose).toHaveBeenCalledTimes(1));
});

it('shows empty library and no-results states', async () => {
  const screen = await render(<RelatedCardsPicker {...props()} items={[a]} selectedIds={[]} />);
  expect(screen.getByText('No other cards available')).toBeTruthy();
  await screen.rerender(<RelatedCardsPicker {...props()} />);
  await fireEvent.changeText(screen.getByLabelText('Search related cards'), 'missing');
  expect(screen.getByText('No matching cards')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Clear search'));
  expect(screen.getByLabelText('Beta')).toBeTruthy();
});

it('hides an empty section and ignores missing/self references', async () => {
  const screen = await render(
    <RelatedCardsSection item={{ ...a, relatedItemIds: ['a', 'missing'] }} items={items} />
  );
  expect(screen.queryByTestId('related-cards-section')).toBeNull();
});

it('shows incoming relationships and navigates to related details', async () => {
  const screen = await render(
    <RelatedCardsSection item={a} items={[a, { ...b, relatedItemIds: ['a'] }]} />
  );
  expect(screen.getByText('Related cards (1)')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Beta'));
  expect(router.push).toHaveBeenCalledWith({ pathname: '/card/[id]', params: { id: 'b' } });
});

it('allows retry after a selected card disappears from the reloaded library', async () => {
  const handlers = props();
  handlers.onSave.mockRejectedValueOnce(new Error('A selected card is no longer available'));
  const screen = await render(<RelatedCardsPicker {...handlers} />);
  await fireEvent.press(screen.getByLabelText('Save related cards'));
  await screen.rerender(<RelatedCardsPicker {...handlers} items={[a, c]} />);
  expect(screen.getByText('0 selected')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Save related cards'));
  expect(handlers.onSave).toHaveBeenLastCalledWith([]);
});
