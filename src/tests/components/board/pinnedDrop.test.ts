import {
  getPinnedDropTarget,
  PINNED_DROP_ANIMATION_DURATION,
  schedulePinnedRemoval,
} from '@/components/board/pinnedDrop';

describe('getPinnedDropTarget', () => {
  const container = { x: 20, y: 100, width: 300, height: 130 };

  it('keeps a card when the touch ends inside the pinned container', () => {
    expect(getPinnedDropTarget({ x: 160, y: 220 }, container, 2)).toEqual({
      type: 'reorder',
      index: 2,
    });
  });

  it.each([
    { x: 19, y: 150 },
    { x: 321, y: 150 },
    { x: 160, y: 99 },
    { x: 160, y: 231 },
  ])('removes a card when released outside at $x,$y', (touch) => {
    expect(getPinnedDropTarget(touch, container, 0)).toEqual({ type: 'remove' });
  });
});

it('waits for the drop animation before removing a pinned card', () => {
  jest.useFakeTimers();
  const onRemove = jest.fn();

  schedulePinnedRemoval(onRemove, 'card-1');
  jest.advanceTimersByTime(PINNED_DROP_ANIMATION_DURATION);
  expect(onRemove).not.toHaveBeenCalled();

  jest.advanceTimersByTime(40);
  expect(onRemove).toHaveBeenCalledWith('card-1');
  jest.useRealTimers();
});
