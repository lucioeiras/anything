import { fireEvent, render } from '@testing-library/react-native';

import { NewNoteModal } from '@/components/modals/NewNoteModal';

const mockAddTextItem = jest.fn();

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock('@/hooks/useLibrary', () => ({
  useLibrary: () => ({
    addMusicItem: jest.fn(),
    addTextItem: mockAddTextItem,
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
});
