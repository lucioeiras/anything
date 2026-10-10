import { decodeHTML } from 'entities';
import { Image as ExpoImage } from 'expo-image';
import { cssInterop } from 'nativewind';
import { GameControllerIcon, StarIcon } from 'phosphor-react-native';
import { Text, View } from 'react-native';

cssInterop(ExpoImage, { className: 'style' });

type GameCardProps = {
  title: string;
  cover: string;
  platforms?: string[];
  genres?: string[];
  releaseYear?: string;
  rating?: number;
  metacritic?: number;
};

export const GameCard = ({
  title,
  cover,
  platforms,
  genres,
  releaseYear,
  rating,
  metacritic,
}: GameCardProps) => {
  const displayPlatforms = platforms?.slice(0, 3) ?? [];
  const primaryGenre = genres && genres.length > 0 ? genres[0] : null;

  return (
    <View className="w-full overflow-hidden bg-zinc-900 border border-zinc-800">
      <View className="relative w-full h-44 bg-zinc-950">
        {cover ? (
          <ExpoImage
            source={{ uri: cover }}
            className="w-full h-44"
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View className="w-full h-44 items-center justify-center bg-zinc-900">
            <GameControllerIcon size={44} color="#71717A" weight="duotone" />
          </View>
        )}

        {metacritic ? (
          <View
            className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded border ${
              metacritic >= 75
                ? 'bg-emerald-950/80 border-emerald-500/60'
                : metacritic >= 50
                  ? 'bg-amber-950/80 border-amber-500/60'
                  : 'bg-red-950/80 border-red-500/60'
            }`}
          >
            <Text
              className={`font-sans-bold text-xs ${
                metacritic >= 75
                  ? 'text-emerald-400'
                  : metacritic >= 50
                    ? 'text-amber-400'
                    : 'text-red-400'
              }`}
            >
              {metacritic}
            </Text>
          </View>
        ) : rating && rating > 0 ? (
          <View className="absolute top-2.5 right-2.5 flex-row items-center gap-1 px-2 py-0.5 rounded bg-black/70 border border-zinc-700/60">
            <StarIcon size={12} color="#FBBF24" weight="fill" />
            <Text className="font-sans-bold text-xs text-amber-300">{rating.toFixed(1)}</Text>
          </View>
        ) : null}
      </View>

      <View className="w-full p-4 gap-2 bg-emerald-950/10">
        <Text className="font-sans-semibold text-base leading-snug text-zinc-50" numberOfLines={2}>
          {decodeHTML(title)}
        </Text>

        <View className="flex-row items-center justify-between mt-1">
          <View className="flex-row items-center gap-1.5 flex-1 mr-2">
            <GameControllerIcon size={14} color="#10B981" weight="duotone" />
            <Text className="font-sans-medium text-xs text-emerald-400" numberOfLines={1}>
              {primaryGenre ? decodeHTML(primaryGenre) : 'Game'}
              {releaseYear ? ` · ${releaseYear}` : ''}
            </Text>
          </View>

          {displayPlatforms.length > 0 && (
            <View className="flex-row items-center gap-1">
              {displayPlatforms.map((plat) => (
                <View
                  key={plat}
                  className="px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/50"
                >
                  <Text className="font-sans text-[10px] text-zinc-300" numberOfLines={1}>
                    {plat}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};
