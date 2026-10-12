import { fireEvent, render } from '@testing-library/react-native';

import { ItemCard } from '@/components/cards/ItemCard';
import type { LibraryItem } from '@/lib/library/types';

jest.mock('@/components/PdfPreview', () => ({ PdfPreview: () => null }));

const base = {
  version: 1 as const,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const examples: [LibraryItem, string][] = [
  [{ ...base, id: 'note', type: 'note', text: 'Note body', title: 'A note' }, 'Note body'],
  [{ ...base, id: 'quote', type: 'quote', text: 'A quote', title: 'Quote source' }, 'A quote'],
  [{ ...base, id: 'image', type: 'image', image: 'image.jpg', title: 'An image' }, 'An image'],
  [{ ...base, id: 'pdf', type: 'pdf', pdf: 'files/report.pdf', title: 'A report' }, 'A report'],
  [
    {
      ...base,
      id: 'link',
      type: 'link',
      url: 'https://www.example.com/path',
      siteTitle: 'Example',
      description: 'A link description',
      favicon: 'favicon.jpg',
    },
    'Example',
  ],
  [
    {
      ...base,
      id: 'article',
      type: 'article',
      url: 'https://example.com/article',
      title: 'An article',
      origin: 'Example News',
      thumbnail: 'article.jpg',
    },
    'An article',
  ],
  [
    {
      ...base,
      id: 'youtube',
      type: 'youtube',
      url: 'https://youtube.com/watch?v=abc',
      title: 'A video',
      thumbnail: 'video.jpg',
    },
    'A video',
  ],
  [
    {
      ...base,
      id: 'tiktok',
      type: 'tiktok',
      url: 'https://www.tiktok.com/@person/video/123',
      title: 'A TikTok video',
      thumbnail: 'tiktok.jpg',
    },
    'A TikTok video',
  ],
  [
    {
      ...base,
      id: 'tweet',
      type: 'tweet',
      url: 'https://x.com/user/status/1',
      author: 'A User',
      avatar: 'avatar.jpg',
      text: 'A post',
    },
    'A post',
  ],
  [
    {
      ...base,
      id: 'reddit',
      type: 'reddit',
      url: 'https://reddit.com/r/test/1',
      subreddit: 'r/test',
      subredditAvatar: 'reddit.jpg',
      title: 'A discussion',
      text: 'Reddit content',
    },
    'A discussion',
  ],
  [
    {
      ...base,
      id: 'book',
      type: 'book',
      isbn: '1234567890',
      title: 'A book',
      authors: ['An Author'],
      cover: 'book.jpg',
    },
    'A book',
  ],
  [
    {
      ...base,
      id: 'music',
      type: 'music',
      title: 'A song',
      artist: 'A Singer',
      cover: 'album.jpg',
    },
    'A song',
  ],
  [
    {
      ...base,
      id: 'movie',
      type: 'movie',
      tmdbId: 1,
      title: 'A movie',
      poster: 'poster.jpg',
    },
    'A movie',
  ],
  [{ ...base, id: 'game', type: 'game', title: 'A game', cover: 'game.jpg' }, 'A game'],
];

describe('ItemCard', () => {
  it.each(examples)('renders the %s item variant', async (item, expectedText) => {
    const { getByText } = await render(<ItemCard item={item} />);
    expect(getByText(expectedText)).toBeTruthy();
  });

  it('renders TikTok with a vertical thumbnail and without progress status', async () => {
    const tiktok = examples.find(([item]) => item.type === 'tiktok')?.[0];
    if (!tiktok) throw new Error('Missing TikTok test item');

    const { getByTestId, getByText, queryByText } = await render(<ItemCard item={tiktok} />);
    expect(getByTestId('video-thumbnail-container').props.style).toMatchObject({
      aspectRatio: 9 / 16,
    });
    expect(getByText('TikTok')).toBeTruthy();
    expect(queryByText('Want to watch')).toBeNull();
  });

  it('passes press actions the original item and supports selection display', async () => {
    const item = examples[0][0];
    const onPress = jest.fn();
    const onLongPress = jest.fn();
    const { getByText } = await render(
      <ItemCard item={item} isEditing isSelected onPress={onPress} onLongPress={onLongPress} />
    );

    await fireEvent.press(getByText('Note body'));
    expect(onPress).toHaveBeenCalledWith(item);
  });

  it('rounds the selection outline to match the card corners', async () => {
    const item = examples[0][0];
    const { getByTestId } = await render(<ItemCard item={item} isEditing isSelected />);

    expect(getByTestId('item-card-selection-outline').props.className).toContain('rounded-xl');
  });

  it('makes multi-image tweets interactive inside the tweet card', async () => {
    const item: LibraryItem = {
      ...base,
      id: 'tweet-gallery',
      type: 'tweet',
      url: 'https://x.com/user/status/2',
      author: 'A User',
      avatar: 'avatar.jpg',
      text: 'Gallery post',
      images: ['one.jpg', 'two.jpg'],
    };
    const onPress = jest.fn();
    const { getByText } = await render(<ItemCard item={item} onPress={onPress} />);

    await fireEvent.press(getByText('Gallery post'));
    expect(onPress).toHaveBeenCalledWith(item);
  });
});
