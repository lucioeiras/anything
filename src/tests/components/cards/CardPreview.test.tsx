import { render } from '@testing-library/react-native';

import { CardPreview } from '@/components/card/CardPreview';
import type { NoteItem } from '@/lib/library/types';

jest.mock('expo-audio', () => ({
  useAudioPlayer: () => ({ play: jest.fn(), pause: jest.fn(), setPlaybackRate: jest.fn() }),
  useAudioPlayerStatus: () => ({ duration: 0, currentTime: 0, playbackRate: 1, playing: false }),
}));

describe('CardPreview', () => {
  it('renders the note body as Markdown', async () => {
    const item: NoteItem = {
      id: 'note-1',
      version: 1,
      type: 'note',
      text: '# Read later',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const { getByText } = await render(
      <CardPreview
        item={item}
        title=""
        editedText={item.text}
        onTextChange={jest.fn()}
        onTextBlur={jest.fn()}
        onTextFocus={jest.fn()}
        onDismissEditingTags={jest.fn()}
      />
    );

    expect(getByText('Read later')).toBeTruthy();
  });
});
