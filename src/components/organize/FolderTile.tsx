import { Image } from 'expo-image';
import {
  BookmarkSimpleIcon,
  CheckCircleIcon,
  ClockIcon,
  ProhibitIcon,
} from 'phosphor-react-native';
import { Pressable, Text, View } from 'react-native';

import { getItemArtwork, STATUS_FOLDERS } from '@/lib/library/organize';
import type { LibraryItem, MediaProgressStatus } from '@/lib/library/types';

const statusIcons = {
  want: BookmarkSimpleIcon,
  'in-progress': ClockIcon,
  completed: CheckCircleIcon,
  abandoned: ProhibitIcon,
} as const;

type Props = {
  title: string;
  items: LibraryItem[];
  status?: MediaProgressStatus;
  highlighted?: boolean;
  horizontal?: boolean;
  disabled?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  onToggleHighlight?: () => void;
};

export function FolderTile({
  title,
  items,
  status,
  highlighted,
  horizontal = false,
  disabled = false,
  onPress,
  onLongPress,
  onToggleHighlight,
}: Props) {
  const artwork = items
    .map(getItemArtwork)
    .filter((value): value is string => Boolean(value))
    .slice(0, 3);
  const StatusIcon = status ? statusIcons[status] : null;
  const titleColor = status
    ? STATUS_FOLDERS.find((folder) => folder.key === status)?.color
    : undefined;

  return (
    <View
      className={`${horizontal ? 'w-[152px] flex-shrink-0' : 'w-1/2'} items-center pb-6 ${disabled ? 'opacity-40' : ''}`}
    >
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${items.length} cards`}
        accessibilityState={{ disabled }}
        className="w-full items-center"
      >
        <View className="mb-[9px] h-[136px] w-[136px]">
          <View className="absolute left-4 top-2 h-[116px] w-[104px] -translate-x-[9px] translate-y-[5px] -rotate-[11deg] overflow-hidden rounded-[10px] border border-zinc-800">
            {artwork[2] && (
              <Image source={{ uri: artwork[2] }} contentFit="cover" className="h-full w-full" />
            )}
          </View>
          <View className="absolute left-4 top-2 h-[116px] w-[104px] translate-x-[9px] translate-y-[3px] rotate-[9deg] overflow-hidden rounded-[10px] border border-zinc-800 bg-zinc-900/50">
            {artwork[1] && (
              <Image source={{ uri: artwork[1] }} contentFit="cover" className="h-full w-full" />
            )}
          </View>
          <View className="absolute left-4 top-2 h-[116px] w-[104px] overflow-hidden rounded-[10px] border border-zinc-800 bg-zinc-900">
            {artwork[0] && (
              <Image source={{ uri: artwork[0] }} contentFit="cover" className="h-full w-full" />
            )}
          </View>
        </View>

        <View className="max-w-full flex-row items-center justify-center gap-1.5 px-2">
          {StatusIcon && <StatusIcon size={15} color={titleColor} weight="bold" />}
          <Text
            className="flex-shrink text-center font-sans-semibold text-sm text-zinc-50"
            style={titleColor ? { color: titleColor } : undefined}
            numberOfLines={2}
          >
            {title}
          </Text>
        </View>

        <Text className="mt-[3px] font-sans text-xs text-zinc-400">
          {items.length} {items.length === 1 ? 'card' : 'cards'}
        </Text>
      </Pressable>

      {onToggleHighlight && (
        <Pressable
          onPress={onToggleHighlight}
          accessibilityRole="button"
          accessibilityLabel={
            highlighted ? `Remove ${title} from highlights` : `Highlight ${title}`
          }
          className={`absolute right-10 top-[104px] h-9 w-9 items-center justify-center rounded-full p-1.5 ${highlighted ? ' bg-white' : ' bg-zinc-800'}`}
        >
          <Text
            className={`text-xl leading-tight ${highlighted ? 'text-zinc-950' : 'text-zinc-400'}`}
          >
            {highlighted ? '★' : '☆'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
