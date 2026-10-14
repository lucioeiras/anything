import { advanceReviewQueue, createReviewQueue, getReviewSwipeAction } from '@/lib/library/review';
import type { LibraryItem } from '@/lib/library/types';

function note(id: string): LibraryItem {
  return {
    id,
    type: 'note',
    text: id,
    version: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('review queue', () => {
  it('returns an empty queue for an empty library', () => {
    expect(createReviewQueue([])).toEqual([]);
    expect(advanceReviewQueue([], [])).toEqual([]);
  });

  it('includes each library item exactly once per round', () => {
    const cards = [note('a'), note('b'), note('c'), note('d')];
    const queue = createReviewQueue(cards, () => 0.25);

    expect(queue).toHaveLength(cards.length);
    expect(new Set(queue)).toEqual(new Set(cards.map((card) => card.id)));
  });

  it('allows a single card and starts a new round after it is reviewed', () => {
    const cards = [note('only')];
    const queue = createReviewQueue(cards);

    expect(queue).toEqual(['only']);
    expect(advanceReviewQueue(queue, cards)).toEqual(['only']);
  });

  it('starts a new round without immediately repeating the previous card', () => {
    const cards = [note('a'), note('b'), note('c')];

    expect(createReviewQueue(cards, () => 0, 'a')).toEqual(['b', 'c', 'a']);
  });

  it('advances through the current round before reshuffling current library items', () => {
    const cards = [note('a'), note('b'), note('c')];

    expect(advanceReviewQueue(['a', 'b', 'c'], cards, () => 0)).toEqual(['b', 'c']);
    expect(advanceReviewQueue(['c'], cards, () => 0)).toEqual(['b', 'c', 'a']);
  });

  it('excludes deleted cards from the next round', () => {
    const remainingCards = [note('a'), note('c')];

    expect(advanceReviewQueue(['b'], remainingCards, () => 0)).toEqual(['c', 'a']);
  });

  it('maps left swipes to delete and right swipes to keep', () => {
    expect(getReviewSwipeAction(-100, 0, 400)).toBe('delete');
    expect(getReviewSwipeAction(100, 0, 400)).toBe('keep');
    expect(getReviewSwipeAction(0, -0.8, 400)).toBe('delete');
    expect(getReviewSwipeAction(0, 0.8, 400)).toBe('keep');
    expect(getReviewSwipeAction(20, 0, 400)).toBeNull();
  });
});
