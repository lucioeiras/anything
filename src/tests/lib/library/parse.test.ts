import { parseItem } from '@/lib/library/parse';

const base = { id: 'item-1', createdAt: '2026-01-02T03:04:05.000Z' };

describe('parseItem', () => {
  it('rejects values that are not objects and invalid common fields', () => {
    expect(() => parseItem(null)).toThrow('not a JSON object');
    expect(() => parseItem([])).toThrow('not a JSON object');
    expect(() => parseItem({ ...base, id: '' })).toThrow('missing "id"');
    expect(() => parseItem({ ...base, type: 'unknown' })).toThrow('unknown "type"');
    expect(() => parseItem({ ...base, type: 'note', createdAt: 4 })).toThrow('missing "createdAt"');
  });

  it('validates required fields for every supported item type', () => {
    const required: Record<string, Record<string, string>> = {
      note: { text: 'text' },
      quote: { text: 'text' },
      image: { image: 'image.jpg' },
      pdf: { pdf: 'file.pdf' },
      video: { video: 'videos/clip.mp4' },
      link: { url: 'url', siteTitle: 'siteTitle', favicon: 'favicon' },
      article: { url: 'url', title: 'title', thumbnail: 'thumbnail' },
      youtube: { url: 'url', title: 'title', thumbnail: 'thumbnail' },
      tweet: { author: 'author', avatar: 'avatar', text: 'text' },
      reddit: { subreddit: 'subreddit', subredditAvatar: 'subredditAvatar', title: 'title' },
      book: { isbn: 'isbn', title: 'title' },
      music: { title: 'title', artist: 'artist', cover: 'cover' },
      movie: { title: 'title', poster: 'poster' },
      game: { title: 'title', cover: 'cover' },
    };

    for (const [type, fields] of Object.entries(required)) {
      expect(() => parseItem({ ...base, type })).toThrow(`"${type}" item is missing`);
      expect(parseItem({ ...base, type, ...fields })).toMatchObject({
        version: 1,
        updatedAt: base.createdAt,
      });
    }
  });

  it('decodes text fields, drops invalid linked ids, and keeps valid links', () => {
    expect(
      parseItem({
        ...base,
        type: 'note',
        text: 'Tea &amp; toast',
        title: 'A &lt; B',
        linkedItemId: '',
      })
    ).toMatchObject({ text: 'Tea & toast', title: 'A < B' });
    expect(
      parseItem({ ...base, type: 'note', text: 'linked', linkedItemId: 'book-1' })
    ).toMatchObject({ linkedItemId: 'book-1' });
  });

  it('drops legacy TikTok progress statuses', () => {
    expect(
      parseItem({
        ...base,
        type: 'tiktok',
        url: 'https://www.tiktok.com/@person/video/123',
        title: 'A TikTok video',
        thumbnail: 'cover.jpg',
        progressStatus: 'completed',
      })
    ).not.toHaveProperty('progressStatus');
  });

  it('normalizes quote authors and filters malformed book reading logs', () => {
    const quote = parseItem({ ...base, type: 'quote', text: 'Words', author: 'A &amp; B' });
    expect(quote).toMatchObject({ author: 'A & B' });

    const book = parseItem({
      ...base,
      type: 'book',
      isbn: '1234567890',
      title: 'Book',
      authors: ['A &amp; B', 3],
      readingLogs: [
        { id: 'valid', date: '2026-01-02', page: 12, createdAt: base.createdAt },
        { id: 'invalid-date', date: 'yesterday', page: 4, createdAt: base.createdAt },
        { id: 'invalid-page', date: '2026-01-02', page: -1, createdAt: base.createdAt },
        null,
      ],
    });
    expect(book).toMatchObject({
      authors: ['A & B', '3'],
      readingLogs: [{ id: 'valid', page: 12 }],
    });
  });
});
