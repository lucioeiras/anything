import { ScrollView, View } from 'react-native';

import { ItemCard } from '@/components/cards/ItemCard';
import type { LibraryItem } from '@/lib/library/types';

type Props = {
  items: LibraryItem[];
  isEditing: boolean;
  onPress: (item: LibraryItem) => void;
  onLongPress: (item: LibraryItem) => void;
};

export function BoardPinnedItems({ items, isEditing, onPress, onLongPress }: Props) {
  return (
    <View testID="pinned-cards-container" className="mx-3 mb-5 rounded-xl bg-zinc-800/80 p-3">
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -12 }}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 12 }}
      >
        {items.map((item) => {
          const hideTitle = [
            'note',
            'quote',
            'book',
            'music',
            'movie',
            'image',
            'video',
            'game',
            'reddit',
          ].includes(item.type);

          return (
            <View
              key={item.id}
              style={{
                width: 150,
                height: 100,
                borderRadius: 12,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <View
                style={{
                  width: 150 / 0.7,
                  transform: [{ scale: 0.7 }],
                  transformOrigin: 'top left',
                }}
              >
                <ItemCard
                  item={item}
                  hideTitleAndAuthor={hideTitle}
                  compactAudioWaveform
                  compactTikTokThumbnail
                  compactMedia={item.type === 'tweet' || item.type === 'reddit'}
                  fixedHeight={100 / 0.7}
                  onPress={isEditing ? undefined : onPress}
                  onLongPress={isEditing ? undefined : onLongPress}
                />
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
