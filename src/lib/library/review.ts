import type { LibraryItem } from '@/lib/library/types';

/** Returns a shuffled list of item IDs, avoiding an immediate repeat between rounds. */
export function createReviewQueue(
  items: LibraryItem[],
  random: () => number = Math.random,
  previousId?: string | null
): string[] {
  const ids = items.map((item) => item.id);

  for (let index = ids.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [ids[index], ids[target]] = [ids[target], ids[index]];
  }

  if (ids.length > 1 && ids[0] === previousId) {
    [ids[0], ids[1]] = [ids[1], ids[0]];
  }

  return ids;
}

/** Advances the current queue and starts a fresh round when it runs out. */
export function advanceReviewQueue(
  queue: string[],
  items: LibraryItem[],
  random: () => number = Math.random
): string[] {
  const remaining = queue.slice(1);
  if (remaining.length > 0) return remaining;

  return createReviewQueue(items, random, queue[0]);
}

export function getReviewSwipeAction(
  distanceX: number,
  velocityX: number,
  screenWidth: number
): 'keep' | 'delete' | null {
  'worklet';

  const threshold = Math.min(120, screenWidth * 0.25);
  if (distanceX <= -threshold || velocityX <= -0.7) return 'delete';
  if (distanceX >= threshold || velocityX >= 0.7) return 'keep';
  return null;
}
