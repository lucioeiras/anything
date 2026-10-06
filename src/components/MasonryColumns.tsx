import type { ReactElement, ReactNode } from 'react';
import { View } from 'react-native';

type Props<T> = {
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  /** Rough relative height of an item, used to balance the columns. */
  estimateHeight?: (item: T) => number;
};

/**
 * Simple two-column masonry layout. Items are placed in the currently shorter
 * column (by estimated height) so the columns stay balanced.
 *
 * Fine for a few hundred items. For thousands, switch to a virtualized list
 * (e.g. FlashList v2 with `masonry`).
 */
export function MasonryColumns<T>({
  data,
  keyExtractor,
  renderItem,
  estimateHeight = () => 1,
}: Props<T>): ReactElement {
  const columns: [T[], T[]] = [[], []];
  const heights = [0, 0];

  for (const item of data) {
    const target = heights[0] <= heights[1] ? 0 : 1;
    columns[target].push(item);
    heights[target] += estimateHeight(item);
  }

  return (
    <View className="flex-row items-start gap-5">
      {columns.map((column, index) => (
        <View key={index} className="flex-1 gap-5">
          {column.map((item) => (
            <View key={keyExtractor(item)}>{renderItem(item)}</View>
          ))}
        </View>
      ))}
    </View>
  );
}
