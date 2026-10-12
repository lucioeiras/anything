import { fireEvent, render } from '@testing-library/react-native';

import { FolderTile } from '@/components/organize/FolderTile';
import type { LibraryItem } from '@/lib/library/types';

const imageItem = (id: string, image: string): LibraryItem => ({
  id,
  version: 1,
  type: 'image',
  image,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
});

describe('FolderTile', () => {
  it('shows its title, singular count and artwork', async () => {
    const { getByLabelText, getByText } = await render(
      <FolderTile title="Favorites" items={[imageItem('one', 'one.jpg')]} onPress={jest.fn()} />
    );

    expect(getByLabelText('Favorites, 1 cards')).toBeTruthy();
    expect(getByText('1 card')).toBeTruthy();
  });

  it('calls tile, long-press and highlight actions', async () => {
    const onPress = jest.fn();
    const onLongPress = jest.fn();
    const onToggleHighlight = jest.fn();
    const { getByLabelText } = await render(
      <FolderTile
        title="Read later"
        items={[]}
        status="want"
        onPress={onPress}
        onLongPress={onLongPress}
        onToggleHighlight={onToggleHighlight}
      />
    );

    await fireEvent.press(getByLabelText('Read later, 0 cards'));
    await fireEvent(getByLabelText('Read later, 0 cards'), 'longPress');
    await fireEvent.press(getByLabelText('Highlight Read later'));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(onToggleHighlight).toHaveBeenCalledTimes(1);
  });

  it('prevents opening disabled tiles when no long-press action is available', async () => {
    const onPress = jest.fn();
    const { getByLabelText } = await render(
      <FolderTile title="Archived" items={[]} disabled onPress={onPress} />
    );

    await fireEvent.press(getByLabelText('Archived, 0 cards'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
