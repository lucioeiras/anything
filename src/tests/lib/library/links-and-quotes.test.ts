import { getLinkableTitle, getLinkableTypeLabel, isLinkableItem } from '@/lib/library/links';
import { isQuoteText } from '@/lib/library/quotes';
import type { LibraryItem } from '@/lib/library/types';

describe('link and quote helpers', () => {
  it('uses link title fallbacks and readable type labels', () => {
    const link = {
      type: 'link',
      title: '',
      siteTitle: 'Example',
      url: 'https://example.com',
      description: '',
      favicon: '',
      id: '1',
      version: 1,
      createdAt: '',
      updatedAt: '',
    } as LibraryItem;
    const song = {
      ...link,
      type: 'music',
      title: 'Track',
      artist: 'Artist',
      cover: '',
      musicKind: 'song',
    } as LibraryItem;
    expect(isLinkableItem(link)).toBe(true);
    expect(getLinkableTitle(link as never)).toBe('Example');
    expect(getLinkableTypeLabel(song as never)).toBe('Song');
    expect(isLinkableItem({ ...link, type: 'note' } as LibraryItem)).toBe(false);
  });

  it.each([
    ['"quoted"', true],
    ['  “quoted”  ', true],
    ['"unclosed', false],
    ['plain text', false],
    ['', false],
  ])('detects quote format in %s', (text, expected) => {
    expect(isQuoteText(text)).toBe(expected);
  });
});
