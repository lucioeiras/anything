import { decodeHTML } from 'entities';
import { Image as ExpoImage } from 'expo-image';
import { cssInterop } from 'nativewind';
import { GameControllerIcon } from 'phosphor-react-native';
import { Text, View } from 'react-native';

import type { MediaProgressStatus } from '@/lib/library/types';

import { ProgressStatus } from './ProgressStatus';

cssInterop(ExpoImage, { className: 'style' });

type GameCardProps = {
  title: string;
  cover: string;
  hideTitleAndAuthor?: boolean;
  progressStatus?: MediaProgressStatus;
};

export const GameCard = ({
  title,
  cover,
  hideTitleAndAuthor = false,
  progressStatus,
}: GameCardProps) => {
  return (
    <View className="w-full">
      <View
        testID="game-cover-container"
        className="w-full overflow-hidden rounded-xl bg-zinc-900"
        style={{ aspectRatio: 1 }}
      >
        {cover ? (
          <ExpoImage source={{ uri: cover }} className="w-full h-full" contentFit="cover" />
        ) : (
          <View className="flex-1 items-center justify-center">
            <GameControllerIcon size={44} color="#71717A" weight="duotone" />
          </View>
        )}
      </View>

      {!hideTitleAndAuthor && (
        <View className="w-full my-3 gap-2">
          <Text
            className="font-sans-semibold text-sm leading-snug text-zinc-50 text-center"
            numberOfLines={2}
          >
            {decodeHTML(title)}
          </Text>
          <ProgressStatus type="game" status={progressStatus} />
        </View>
      )}
    </View>
  );
};
