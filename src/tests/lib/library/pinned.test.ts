import {
  canPinItem,
  getPinnedItems,
  MAX_PINNED_ITEMS,
  movePinnedItem,
  nextPinnedAt,
  shouldPreservePinnedAspectRatio,
} from '@/lib/library/pinned';
import type { LibraryItem } from '@/lib/library/types';

function note(id: string, pinnedAt?: string): LibraryItem {
  return {
    id,
    type: 'note',
    text: id,
    version: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...(pinnedAt ? { pinnedAt } : {}),
  };
}

describe('pinned cards', () => {
  it('returns pinned items in the order they were pinned', () => {
    const cards = [
      note('later', '2026-01-03T00:00:00.000Z'),
      note('unPinned'),
      note('first', '2026-01-01T00:00:00.000Z'),
    ];

    expect(getPinnedItems(cards).map((item) => item.id)).toEqual(['first', 'later']);
  });

  it('allows unpinning at capacity but blocks another pin', () => {
    const cards = Array.from({ length: MAX_PINNED_ITEMS }, (_, index) =>
      note(`pinned-${index}`, `2026-01-0${index + 1}T00:00:00.000Z`)
    );

    expect(canPinItem(cards, 'pinned-0')).toBe(true);
    expect(canPinItem([...cards, note('other')], 'other')).toBe(false);
    expect(canPinItem(cards.slice(0, -1).concat(note('other')), 'other')).toBe(true);
  });

  it('assigns each new pin a timestamp after existing pins', () => {
    const cards = [note('existing', '2026-01-01T00:00:00.000Z')];
    expect(nextPinnedAt(cards, Date.parse('2026-01-01T00:00:00.000Z'))).toBe(
      '2026-01-01T00:00:00.001Z'
    );
  });

  it('moves a pinned card to a bounded target position', () => {
    const cards = [note('first'), note('second'), note('third')];

    expect(movePinnedItem(cards, 'third', 0).map((item) => item.id)).toEqual([
      'third',
      'first',
      'second',
    ]);
    expect(movePinnedItem(cards, 'first', 99).map((item) => item.id)).toEqual([
      'second',
      'third',
      'first',
    ]);
    expect(movePinnedItem(cards, 'missing', 0)).toBe(cards);
  });

  it('preserves media aspect ratios in pinned previews', () => {
    expect(
      ['image', 'music', 'book', 'movie', 'game'].map((type) =>
        shouldPreservePinnedAspectRatio(type as LibraryItem['type'])
      )
    ).toEqual([true, true, true, true, true]);
    expect(shouldPreservePinnedAspectRatio('note')).toBe(false);
  });
});
