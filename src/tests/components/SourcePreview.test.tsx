import { fireEvent, render } from '@testing-library/react-native';

import { SourcePreview } from '@/components/SourcePreview';
import type { LinkableItem } from '@/lib/library/links';

const linkedBook: LinkableItem = {
  id: 'book-1',
  version: 1,
  type: 'book',
  isbn: '1234567890',
  title: 'A linked book',
  authors: ['Ada Lovelace'],
  cover: 'cover.jpg',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('SourcePreview', () => {
  it('shows the linked item type, title and subtitle', async () => {
    const { getByText } = await render(<SourcePreview item={linkedBook} />);
    expect(getByText('Book')).toBeTruthy();
    expect(getByText('A linked book')).toBeTruthy();
    expect(getByText('Ada Lovelace')).toBeTruthy();
  });

  it('calls change and remove actions', async () => {
    const onChange = jest.fn();
    const onRemove = jest.fn();
    const { getByLabelText } = await render(
      <SourcePreview item={linkedBook} onChange={onChange} onRemove={onRemove} />
    );

    await fireEvent.press(getByLabelText('Change source: A linked book'));
    await fireEvent.press(getByLabelText('Remove source'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('renders pending music as a song preview', async () => {
    const { getByText } = await render(
      <SourcePreview
        pendingMusic={{
          title: 'Night Drive',
          artist: 'The Artists',
          album: 'After Hours',
          cover: '',
        }}
      />
    );
    expect(getByText('Song')).toBeTruthy();
    expect(getByText('Night Drive')).toBeTruthy();
    expect(getByText('The Artists • After Hours')).toBeTruthy();
  });

  it('omits subtitles in compact mode', async () => {
    const { queryByText } = await render(<SourcePreview item={linkedBook} compact />);
    expect(queryByText('Ada Lovelace')).toBeNull();
  });
});
