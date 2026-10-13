export type PinnedDropTarget = { type: 'remove' } | { type: 'reorder'; index: number };

export function getPinnedDropTarget(
  touch: { x: number; y: number },
  container: { x: number; y: number; width: number; height: number },
  index: number
): PinnedDropTarget {
  const isOutside =
    touch.x < container.x ||
    touch.x > container.x + container.width ||
    touch.y < container.y ||
    touch.y > container.y + container.height;

  return isOutside ? { type: 'remove' } : { type: 'reorder', index };
}
