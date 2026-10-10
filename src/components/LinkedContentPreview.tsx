import { Image as ExpoImage } from 'expo-image';
import { LinkIcon, XIcon } from 'phosphor-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { getLinkableTitle, getLinkableTypeLabel, type LinkableItem } from '@/lib/library/links';

type Props = {
  item: LinkableItem;
  onChange?: () => void;
  onRemove?: () => void;
  compact?: boolean;
  containerClassName?: string;
};

function getPreviewImage(item: LinkableItem): string | undefined {
  switch (item.type) {
    case 'article':
    case 'youtube':
      return item.thumbnail;
    case 'link':
      return item.favicon;
    case 'movie':
      return item.poster;
    case 'book':
      return item.cover;
    case 'game':
    case 'music':
      return item.cover;
  }
}

function getPreviewSubtitle(item: LinkableItem): string | undefined {
  switch (item.type) {
    case 'article':
      return item.origin;
    case 'youtube':
      return undefined;
    case 'link':
      return item.description || item.url;
    case 'movie':
      return item.releaseYear || item.releaseDate?.slice(0, 4);
    case 'book':
      return item.authors.join(', ') || item.publishedDate?.slice(0, 4);
    case 'game':
      return item.releaseYear || item.platforms?.join(', ');
    case 'music':
      return [item.artist, item.musicKind === 'song' ? item.album : undefined]
        .filter(Boolean)
        .join(' • ');
  }
}

function getInitialAspectRatio(item: LinkableItem): number {
  switch (item.type) {
    case 'movie':
      return 2 / 3;
    case 'book':
      return item.coverAspectRatio && item.coverAspectRatio > 0 ? item.coverAspectRatio : 2 / 3;
    case 'article':
    case 'youtube':
    case 'game':
      return 16 / 9;
    case 'link':
    case 'music':
      return 1;
  }
}

export function LinkedContentPreview({
  item,
  onChange,
  onRemove,
  compact = false,
  containerClassName = '',
}: Props) {
  const image = getPreviewImage(item);
  const subtitle = getPreviewSubtitle(item);
  const initialRatio = getInitialAspectRatio(item);
  const [loadedRatio, setLoadedRatio] = useState<{ image?: string; ratio: number }>({
    image,
    ratio: initialRatio,
  });
  const aspectRatio = loadedRatio.image === image ? loadedRatio.ratio : initialRatio;
  const maxSize = compact ? 44 : item.type === 'link' ? 64 : item.type === 'music' ? 80 : 96;
  const imageSize = {
    width: aspectRatio >= 1 ? maxSize : maxSize * aspectRatio,
    height: aspectRatio >= 1 ? maxSize / aspectRatio : maxSize,
  };

  const content = (
    <>
      <View
        className="rounded-lg bg-zinc-800 overflow-hidden items-center justify-center"
        style={imageSize}
      >
        {image ? (
          <ExpoImage
            source={{ uri: image }}
            className="w-full h-full"
            contentFit="contain"
            onLoad={(event) => {
              const { width, height } = event.source;
              if (width > 0 && height > 0) {
                const ratio = width / height;
                setLoadedRatio((current) =>
                  current.image === image && current.ratio === ratio ? current : { image, ratio }
                );
              }
            }}
          />
        ) : (
          <LinkIcon size={compact ? 16 : 24} color="#71717A" />
        )}
      </View>
      <View className={`flex-1 ${compact ? 'gap-1.5' : 'gap-2'}`}>
        <Text
          className={`font-sans-medium text-zinc-400 ${compact ? 'text-[10px]' : 'text-xs'}`}
          numberOfLines={1}
        >
          {getLinkableTypeLabel(item)}
        </Text>
        <Text
          className={`font-sans-semibold text-white ${compact ? 'text-xs' : 'text-lg'}`}
          numberOfLines={2}
        >
          {getLinkableTitle(item)}
        </Text>
        {subtitle && !compact ? (
          <Text className="font-sans text-sm text-zinc-400" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </>
  );

  if (compact) {
    return <View className={`flex-row items-center gap-2 ${containerClassName}`}>{content}</View>;
  }

  return (
    <View className={`flex-row items-center gap-4 ${containerClassName}`}>
      <Pressable
        onPress={onChange}
        accessibilityRole="button"
        accessibilityLabel={`Change linked content: ${getLinkableTitle(item)}`}
        className="flex-1 flex-row items-center gap-6"
      >
        {content}
      </Pressable>

      {onRemove && (
        <Pressable
          onPress={onRemove}
          hitSlop={10}
          className="p-2 rounded-full bg-zinc-800 active:opacity-70"
          accessibilityRole="button"
          accessibilityLabel="Remove linked content"
        >
          <XIcon size={16} color="#E4E4E7" weight="bold" />
        </Pressable>
      )}
    </View>
  );
}
