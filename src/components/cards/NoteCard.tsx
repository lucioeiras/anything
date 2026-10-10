import { Text, View } from 'react-native';

import { LinkedContentPreview } from '@/components/LinkedContentPreview';
import type { LinkableItem } from '@/lib/library/links';

type NoteProps = {
  text: string;
  title?: string;
  linkedItem?: LinkableItem;
};

export const NoteCard = ({ text, title, linkedItem }: NoteProps) => {
  return (
    <View className="w-full items-center">
      <View className="w-full bg-zinc-900/80 rounded-xl">
        <View className="p-5">
          <Text className="font-sans text-base leading-[1.8] text-zinc-100" numberOfLines={8}>
            {text}
          </Text>
        </View>

        {linkedItem && (
          <LinkedContentPreview
            item={linkedItem}
            compact
            containerClassName="px-5 py-4 bg-zinc-800/50 gap-4 rounded-b-xl"
          />
        )}
      </View>

      {title && (
        <Text
          className="font-sans-medium text-xs text-zinc-400 leading-[1.6] text-center mt-3"
          numberOfLines={2}
        >
          {title}
        </Text>
      )}
    </View>
  );
};
