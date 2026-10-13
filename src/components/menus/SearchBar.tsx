import { BlurView } from 'expo-blur';
import {
  CalendarBlankIcon,
  BookmarkSimpleIcon,
  CheckCircleIcon,
  ClockIcon,
  FolderIcon,
  HashIcon,
  MagnifyingGlassIcon,
  ProhibitIcon,
  XIcon,
} from 'phosphor-react-native';
import { type ReactNode, type RefObject, useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { STATUS_FOLDERS } from '@/lib/library/organize';
import type { MediaProgressStatus } from '@/lib/library/types';

const statusIcons = {
  want: BookmarkSimpleIcon,
  'in-progress': ClockIcon,
  completed: CheckCircleIcon,
  abandoned: ProhibitIcon,
} satisfies Record<MediaProgressStatus, typeof FolderIcon>;

type SearchFilter = {
  kind: 'tag' | 'folder' | 'date';
  label: string;
  status?: MediaProgressStatus;
  onRemove: () => void;
};

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  visible?: boolean;
  filters?: SearchFilter[];
  blurTarget?: RefObject<View | null>;
  trailingAction?: ReactNode;
  bottomOffset?: number;
};

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search cards, tags, notes...',
  visible = true,
  filters = [],
  blurTarget,
  trailingAction,
  bottomOffset = 0,
}: SearchBarProps) {
  const inputRef = useRef<TextInput>(null);

  if (!visible) return null;

  const handleClear = () => {
    onChangeText('');
    inputRef.current?.focus();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="w-full bg-transparent"
      style={{
        position: 'absolute',
        right: 0,
        bottom: bottomOffset,
        left: 0,
        zIndex: 1000,
        elevation: 1000,
      }}
    >
      <View className="mx-4 my-3 w-auto flex-row items-center gap-3">
        <View
          className="flex-1 rounded-full"
          style={{
            shadowColor: '#A1A1AA',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 8,
          }}
        >
          <View
            className="h-full flex-row items-center overflow-hidden rounded-full border border-white/15 px-6 py-4 gap-4"
            style={{ backgroundColor: 'rgba(9, 9, 11, 0.2)' }}
          >
            <BlurView
              intensity={48}
              tint="dark"
              blurTarget={blurTarget}
              blurMethod="dimezisBlurView"
              pointerEvents="none"
              style={StyleSheet.absoluteFill}
            />

            <MagnifyingGlassIcon size={18} color="#E4E4E7" weight="bold" />

            <View className="flex-1 flex-row flex-wrap items-center gap-2">
              {filters.map((filter) => {
                const isTag = filter.kind === 'tag';
                const status = filter.status
                  ? STATUS_FOLDERS.find((folder) => folder.key === filter.status)
                  : null;
                const Icon = status
                  ? statusIcons[status.key]
                  : isTag
                    ? HashIcon
                    : filter.kind === 'date'
                      ? CalendarBlankIcon
                      : FolderIcon;
                const iconColor = status?.color ?? (isTag ? '#60A5FA' : '#C4B5FD');
                return (
                  <Pressable
                    key={`${filter.kind}:${filter.label}`}
                    onPress={filter.onRemove}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${filter.kind} filter ${filter.label}`}
                    className={`max-w-full flex-row items-center gap-1.5 rounded-full px-3 py-1.5 active:opacity-70 ${status ? '' : isTag ? 'bg-blue-500/15' : 'bg-violet-500/15'}`}
                    style={status ? { backgroundColor: `${status.color}26` } : undefined}
                  >
                    <Icon size={16} color={iconColor} weight="bold" />
                    <Text
                      numberOfLines={1}
                      className={`max-w-[180px] font-sans-medium text-base ${isTag ? 'text-blue-300' : 'text-violet-300'}`}
                      style={status ? { color: status.color } : undefined}
                    >
                      {filter.label}
                    </Text>
                    <XIcon size={14} color={iconColor} weight="bold" />
                  </Pressable>
                );
              })}
              <TextInput
                ref={inputRef}
                value={value}
                onChangeText={onChangeText}
                placeholder={filters.length > 0 ? 'Search within...' : placeholder}
                placeholderTextColor="#71717b"
                className="min-w-[110px] flex-grow font-sans text-2xl text-white leading-tight"
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
                clearButtonMode="never"
              />
            </View>
            {value.length > 0 && (
              <Pressable
                onPress={handleClear}
                hitSlop={10}
                className="p-1.5 rounded-full bg-zinc-700 items-center justify-center active:opacity-70"
                accessibilityLabel="Clear search"
              >
                <XIcon size={12} color="#E4E4E7" weight="bold" />
              </Pressable>
            )}
          </View>
        </View>
        {trailingAction}
      </View>
    </KeyboardAvoidingView>
  );
}
