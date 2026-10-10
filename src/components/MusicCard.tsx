import { decodeHTML } from 'entities';
import { Image as ExpoImage } from 'expo-image';
import { DiscIcon, MusicNotesIcon } from 'phosphor-react-native';
import { useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { VinylRecord } from './VinylRecord';

type MusicCardProps = {
  title: string;
  artist: string;
  album?: string;
  cover: string;
  genre?: string;
};

export const MusicCard = ({ title, artist, album, cover, genre }: MusicCardProps) => {
  const [containerWidth, setContainerWidth] = useState(() =>
    Math.round((Dimensions.get('window').width - 32) / 2)
  );

  const sleeveSize = Math.max(100, Math.round(containerWidth * 0.74));
  const discSize = Math.max(90, Math.round(sleeveSize * 0.94));
  const containerHeight = sleeveSize + 20;
  const discLeft = Math.max(sleeveSize * 0.4, containerWidth - discSize - 6);
  const discTop = 10 + Math.round((sleeveSize - discSize) / 2);

  return (
    <View className="w-full">
      {/* Vinyl Peek Container (Album jacket on left, vinyl sliding out to the right) */}
      <View
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0 && Math.abs(w - containerWidth) > 2) {
            setContainerWidth(w);
          }
        }}
        style={[styles.showcaseContainer, { height: containerHeight }]}
      >
        {/* Vinyl Record (Layered behind jacket, emerging to the right) */}
        <View
          style={[
            styles.discWrapper,
            {
              left: discLeft,
              top: discTop,
            },
          ]}
        >
          <VinylRecord size={discSize} coverUri={cover} />
        </View>

        {/* Album Jacket Sleeve (Layered in front on the left) */}
        <View
          style={[
            styles.sleeve,
            {
              width: sleeveSize,
              height: sleeveSize,
              left: 8,
              top: 10,
            },
          ]}
        >
          {cover ? (
            <ExpoImage
              source={{ uri: cover }}
              style={styles.coverImage}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={styles.fallbackCover}>
              <DiscIcon size={40} color="#71717A" weight="duotone" />
            </View>
          )}

          {/* Right edge sleeve slit opening indicator */}
          <View style={styles.sleeveOpeningEdge} />
        </View>
      </View>

      {/* Track Info */}
      <View className="w-full p-4 gap-1.5 bg-pink-950/15 border-t border-rose-950/20">
        <Text className="font-sans-medium text-base leading-snug text-zinc-50" numberOfLines={2}>
          {decodeHTML(title)}
        </Text>

        <Text className="font-sans text-xs text-zinc-400" numberOfLines={1}>
          {decodeHTML(artist)}
        </Text>

        <View className="flex-row items-center gap-1.5 mt-1">
          <MusicNotesIcon size={12} color="#F43F5E" weight="bold" />
          <Text
            className="font-sans-semibold text-[11px] text-rose-400 uppercase tracking-wider"
            numberOfLines={1}
          >
            {genre ? decodeHTML(genre) : album ? decodeHTML(album) : 'Music'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  showcaseContainer: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#0c0c0e',
    overflow: 'hidden',
  },
  discWrapper: {
    position: 'absolute',
    zIndex: 1,
  },
  sleeve: {
    position: 'absolute',
    zIndex: 2,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 5, height: 2 },
    shadowOpacity: 0.55,
    shadowRadius: 6,
    elevation: 6,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
  },
  fallbackCover: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1c1917',
  },
  sleeveOpeningEdge: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
});
