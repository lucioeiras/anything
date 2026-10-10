import { decodeHTML } from 'entities';
import { Image as ExpoImage } from 'expo-image';
import { cssInterop } from 'nativewind';
import { FilmSlateIcon, StarIcon } from 'phosphor-react-native';
import { memo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

cssInterop(ExpoImage, { className: 'style' });

type MovieCardProps = {
  title: string;
  poster: string;
  releaseYear?: string;
  voteAverage?: number;
  genres?: string[];
  director?: string;
  runtime?: number;
};

type FilmPerforationsProps = {
  height: number;
};

const FilmPerforations = memo(function FilmPerforations({ height }: FilmPerforationsProps) {
  const effectiveHeight = height > 0 ? height : 240;
  const paddingY = 8;
  const usableHeight = Math.max(0, effectiveHeight - paddingY * 2);
  const pitch = 15;
  const count = Math.max(2, Math.floor(usableHeight / pitch));

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.perforationsOverlay]}>
      <View style={{ height: usableHeight }} className="justify-between items-center">
        {Array.from({ length: count }).map((_, i) => (
          <View key={`left-${i}`} style={styles.sprocketHole} />
        ))}
      </View>
      <View style={{ height: usableHeight }} className="justify-between items-center">
        {Array.from({ length: count }).map((_, i) => (
          <View key={`right-${i}`} style={styles.sprocketHole} />
        ))}
      </View>
    </View>
  );
});

export const MovieCard = ({
  title,
  poster,
  releaseYear,
  voteAverage,
  genres,
  director,
  runtime,
}: MovieCardProps) => {
  const [aspectRatio, setAspectRatio] = useState(2 / 3);
  const [posterHeight, setPosterHeight] = useState(0);

  const cleanTitle = title ? decodeHTML(title) : 'Untitled Movie';
  const cleanDirector = director ? decodeHTML(director) : undefined;
  const genreText =
    genres && genres.length > 0 ? genres.slice(0, 2).map(decodeHTML).join(', ') : undefined;

  const metaParts: string[] = [];
  if (releaseYear) metaParts.push(releaseYear);
  if (runtime) metaParts.push(`${runtime} min`);
  if (!releaseYear && !runtime && genreText) metaParts.push(genreText);

  const metaText = metaParts.join(' · ');
  const formattedScore =
    typeof voteAverage === 'number' && voteAverage > 0 ? voteAverage.toFixed(1) : undefined;

  return (
    <View className="w-full overflow-hidden">
      <View
        className="w-full relative overflow-hidden"
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > 0) {
            setPosterHeight(h);
          }
        }}
      >
        {poster ? (
          <ExpoImage
            source={{ uri: poster }}
            className="w-full bg-zinc-900"
            style={{ aspectRatio }}
            contentFit="cover"
            transition={200}
            onLoad={(e) => {
              if (e.source.width && e.source.height) {
                setAspectRatio(e.source.width / e.source.height);
              }
            }}
          />
        ) : (
          <View
            className="w-full bg-amber-950/30 items-center justify-center p-6 border-b border-amber-900/30"
            style={{ aspectRatio: 2 / 3 }}
          >
            <FilmSlateIcon size={40} color="#F59E0B" weight="duotone" />
          </View>
        )}

        {/* Film Strip Sprocket Perforations */}
        <FilmPerforations height={posterHeight} />
      </View>

      <View className="w-full p-5 gap-2 bg-amber-950/15">
        <View className="flex-row items-start justify-between gap-2">
          <Text
            className="flex-1 font-sans-medium text-base leading-[1.3] text-zinc-50"
            numberOfLines={2}
          >
            {cleanTitle}
          </Text>

          {formattedScore && (
            <View className="flex-row items-center gap-1 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded">
              <StarIcon size={11} color="#F59E0B" weight="fill" />
              <Text className="font-sans-bold text-[11px] text-amber-400">{formattedScore}</Text>
            </View>
          )}
        </View>

        {cleanDirector && (
          <Text className="font-sans text-xs text-amber-400/90 leading-[1.4]" numberOfLines={1}>
            Dir. {cleanDirector}
          </Text>
        )}

        {!cleanDirector && genreText && (
          <Text className="font-sans text-xs text-zinc-400 leading-[1.4]" numberOfLines={1}>
            {genreText}
          </Text>
        )}

        <View className="flex-row items-center gap-1.5 mt-1">
          <FilmSlateIcon size={13} color="#F59E0B" weight="bold" />
          <Text className="font-sans-semibold text-xs text-amber-500/80" numberOfLines={1}>
            {metaText || 'Movie'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  perforationsOverlay: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  sprocketHole: {
    width: 6,
    height: 8.5,
    borderRadius: 2,
    backgroundColor: '#09090B',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 1,
    elevation: 2,
  },
});
