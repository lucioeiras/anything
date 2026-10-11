import { decodeHTML } from 'entities';
import { Image as ExpoImage } from 'expo-image';
import { FilmSlateIcon, GameControllerIcon, UsersThreeIcon } from 'phosphor-react-native';
import { ScrollView, Text, View } from 'react-native';

import { cleanRawgDescription } from '@/lib/games/rawg';
import type { LibraryItem } from '@/lib/library/types';
import { getProfileUrl } from '@/lib/movies/tmdb';

export function CardMediaDetails({ item }: { item: LibraryItem }) {
  const gameDescription = item.type === 'game' ? cleanRawgDescription(item.description || '') : '';
  return (
    <>
      {/* Movie Overview Section */}
      {item.type === 'movie' && Boolean(item.overview) && (
        <View className="py-6 px-6 border-b border-zinc-800 gap-3">
          <View className="flex-row items-center gap-2">
            <FilmSlateIcon size={14} color="#E4E4E7" weight="bold" />
            <Text className="font-sans-semibold text-sm tracking-wider uppercase text-zinc-200">
              Overview
            </Text>
          </View>
          <Text className="font-sans text-base text-zinc-300 leading-relaxed">
            {decodeHTML(item.overview || '')}
          </Text>
        </View>
      )}

      {/* Movie Cast Section */}
      {item.type === 'movie' && (item.cast?.length ?? 0) > 0 && (
        <View className="py-6 px-6 border-b border-zinc-800 gap-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <UsersThreeIcon size={14} color="#E4E4E7" weight="bold" />
              <Text className="font-sans-semibold text-sm tracking-wider uppercase text-zinc-200">
                Cast
              </Text>
            </View>
            <Text className="font-sans text-xs text-zinc-500">
              Top {Math.min(item.cast?.length ?? 0, 20)} of {item.cast?.length ?? 0}
            </Text>
          </View>

          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -24 }}
            contentContainerStyle={{ gap: 12, paddingLeft: 24, paddingRight: 24 }}
          >
            {(item.cast ?? []).slice(0, 20).map((person, index) => (
              <View key={`${person.id}-${index}`} className="w-28 gap-3">
                <View className="w-28 h-36 rounded-lg overflow-hidden bg-zinc-900 items-center justify-center">
                  {person.profilePath ? (
                    <ExpoImage
                      source={{ uri: getProfileUrl(person.profilePath) }}
                      className="w-full h-full"
                      contentFit="cover"
                    />
                  ) : (
                    <Text className="font-sans-semibold text-2xl text-zinc-500">
                      {person.name
                        .split(/\s+/)
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join('')}
                    </Text>
                  )}
                </View>
                <Text className="font-sans-medium text-sm text-zinc-100" numberOfLines={2}>
                  {decodeHTML(person.name)}
                </Text>
                {person.character ? (
                  <Text className="font-sans text-xs text-zinc-400 -mt-1.5" numberOfLines={2}>
                    {decodeHTML(person.character)}
                  </Text>
                ) : null}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Game Overview Section */}
      {item.type === 'game' && (
        <View className="py-6 px-6 border-b border-zinc-800 gap-3">
          <View className="flex-row items-center gap-2">
            <GameControllerIcon size={14} color="#E4E4E7" weight="bold" />
            <Text className="font-sans-semibold text-sm tracking-wider uppercase text-zinc-200">
              About
            </Text>
          </View>
          {gameDescription ? (
            <Text className="font-sans text-base text-zinc-300 leading-relaxed">
              {gameDescription}
            </Text>
          ) : null}
        </View>
      )}
    </>
  );
}
