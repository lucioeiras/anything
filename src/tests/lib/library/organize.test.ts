import { getItemArtwork, getTagGroups, matchesStatus } from '@/lib/library/organize';
import type { LibraryItem } from '@/lib/library/types';

const item = (id: string, tags?: string[], extra: Record<string, unknown> = {}) =>
  ({
    id,
    type: 'note',
    version: 1,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    text: id,
    tags,
    ...extra,
  }) as LibraryItem;

describe('library organization helpers', () => {
  it('groups trimmed unique tags and sorts by count then name', () => {
    const a = item('a', [' zeta ', 'alpha', 'alpha', '']);
    const b = item('b', ['zeta', 'beta']);
    const c = item('c', ['beta']);
    expect(getTagGroups([a, b, c])).toEqual([
      { tag: 'beta', items: [b, c] },
      { tag: 'zeta', items: [a, b] },
      { tag: 'alpha', items: [a] },
    ]);
  });

  it('matches progress folders only for trackable items, defaulting missing progress to want', () => {
    const book = {
      ...item('book'),
      type: 'book',
      isbn: '1234567890',
      title: 'Book',
      authors: [],
      progressStatus: undefined,
    } as LibraryItem;
    expect(matchesStatus(book, 'want')).toBe(true);
    expect(matchesStatus(book, 'completed')).toBe(false);
    expect(matchesStatus(item('note'), 'want')).toBe(false);
  });

  it('selects artwork from the correct field and returns undefined when absent', () => {
    expect(
      getItemArtwork({ ...item('img'), type: 'image', image: 'image.jpg' } as LibraryItem)
    ).toBe('image.jpg');
    expect(
      getItemArtwork({
        ...item('tweet'),
        type: 'tweet',
        url: 'url',
        author: 'a',
        avatar: 'avatar',
        text: 't',
        video: { url: 'v', thumbnail: 'video.jpg' },
      } as LibraryItem)
    ).toBe('video.jpg');
    expect(getItemArtwork(item('note'))).toBeUndefined();
  });
});
