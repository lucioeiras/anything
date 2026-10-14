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
      audio: { audio: 'audios/recording.m4a' },
      link: { url: 'url', siteTitle: 'siteTitle', favicon: 'favicon' },
      article: { url: 'url', title: 'title', thumbnail: 'thumbnail' },
      tiktok: { url: 'url', title: 'title', thumbnail: 'thumbnail' },
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
      expect(parseItem({ ...base, type, ...fields, relatedItemIds: ['other'] })).toMatchObject({
        relatedItemIds: ['other'],
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

  it('keeps valid pinned timestamps and discards invalid values', () => {
    const note = {
      ...base,
      type: 'note',
      text: 'Pinned note',
      pinnedAt: '2026-02-03T04:05:06.000Z',
    };
    expect(parseItem(note)).toMatchObject({ pinnedAt: note.pinnedAt });
    expect(parseItem({ ...note, pinnedAt: 'not-a-date' })).not.toHaveProperty('pinnedAt');
    expect(parseItem({ ...note, pinnedAt: 42 })).not.toHaveProperty('pinnedAt');
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

  it('validates persisted audio waveform samples', () => {
    const audio = parseItem({
      ...base,
      type: 'audio',
      audio: 'audios/recording.m4a',
      waveform: [2, 50, 130, 'invalid'],
    });
    expect(audio).toMatchObject({ waveform: [8, 50, 100] });

    const invalid = parseItem({
      ...base,
      type: 'audio',
      audio: 'audios/recording.m4a',
      waveform: 'bad data',
    });
    expect(invalid).not.toHaveProperty('waveform');
  });

  it('keeps valid audio transcripts and discards malformed transcript values', () => {
    const audio = parseItem({
      ...base,
      type: 'audio',
      audio: 'audios/recording.m4a',
      transcript: 'Olá &amp; bem-vindo.',
    });
    expect(audio).toMatchObject({ transcript: 'Olá & bem-vindo.' });

    const invalid = parseItem({
      ...base,
      type: 'audio',
      audio: 'audios/recording.m4a',
      transcript: ['not', 'text'],
    });
    expect(invalid).not.toHaveProperty('transcript');
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

describe('related card parsing', () => {
  it.each([undefined, null, 'bad', 42, {}, []])(
    'ignores invalid/absent lists: %p',
    (relatedItemIds) => {
      expect(
        parseItem({ ...base, type: 'note', text: 'body', relatedItemIds }).relatedItemIds
      ).toBeUndefined();
    }
  );
  it('drops invalid IDs, duplicates and self references while preserving missing-card IDs', () => {
    expect(
      parseItem({
        ...base,
        type: 'note',
        text: 'body',
        relatedItemIds: ['', '  ', null, 2, 'item-1', 'other', 'other', 'missing'],
      }).relatedItemIds
    ).toEqual(['other', 'missing']);
  });
});
