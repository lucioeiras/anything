import { fireEvent, render } from '@testing-library/react-native';

import { NewNoteModal } from '@/components/modals/NewNoteModal';

const mockAddTextItem = jest.fn();
const mockUpdateItem = jest.fn();

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock('@/hooks/useLibrary', () => ({
  useLibrary: () => ({
    addMusicItem: jest.fn(),
    addTextItem: mockAddTextItem,
    updateItem: mockUpdateItem,
    getTags: () => [],
    state: { status: 'ready', result: { items: [] } },
  }),
}));
jest.mock('@/lib/tags/autoTags', () => ({
  generateAutoTags: () => [],
  generateAutoTagsAsync: () => Promise.resolve([]),
}));

describe('NewNoteModal', () => {
  it('shows a live Markdown preview and returns to editing', async () => {
    const { getByLabelText, getByPlaceholderText, getByText } = await render(
      <NewNoteModal visible onClose={jest.fn()} />
    );

    await fireEvent.changeText(getByPlaceholderText('Type here...'), '# Live preview');
    await fireEvent.press(getByLabelText('Preview markdown'));

    expect(getByText('Live preview')).toBeTruthy();
    expect(getByLabelText('Edit markdown')).toBeTruthy();

    await fireEvent.press(getByLabelText('Edit markdown'));
    expect(getByPlaceholderText('Type here...').props.value).toBe('# Live preview');
  });

  it('updates an existing note through the note editor', async () => {
    const onClose = jest.fn();
    const editingItem = {
      id: 'note-1',
      version: 1 as const,
      type: 'note' as const,
      text: 'Original markdown',
      title: 'Original title',
      tags: ['reading'],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    mockUpdateItem.mockResolvedValue({ ...editingItem, text: 'Updated markdown' });
    const { getByPlaceholderText, getByLabelText } = await render(
      <NewNoteModal visible editingItem={editingItem} onClose={onClose} />
    );

    expect(getByPlaceholderText('Type here...').props.value).toBe('Original markdown');
    await fireEvent.changeText(getByPlaceholderText('Type here...'), 'Updated markdown');
    await fireEvent.press(getByLabelText('Save note'));

    expect(mockUpdateItem).toHaveBeenCalledWith('note-1', {
      text: 'Updated markdown',
      title: 'Original title',
      tags: ['reading'],
      autoTags: undefined,
      linkedItemId: undefined,
    });
    expect(mockAddTextItem).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
