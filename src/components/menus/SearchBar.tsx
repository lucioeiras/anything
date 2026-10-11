import {
  BookmarkSimpleIcon,
  CheckCircleIcon,
  ClockIcon,
  FolderIcon,
  HashIcon,
  MagnifyingGlassIcon,
  ProhibitIcon,
  XIcon,
} from 'phosphor-react-native';
import { useRef } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';

import { STATUS_FOLDERS } from '@/lib/library/organize';
import type { MediaProgressStatus } from '@/lib/library/types';

const statusIcons = {
  want: BookmarkSimpleIcon,
  'in-progress': ClockIcon,
  completed: CheckCircleIcon,
  abandoned: ProhibitIcon,
} satisfies Record<MediaProgressStatus, typeof FolderIcon>;

type SearchFilter = {
  kind: 'tag' | 'folder';
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
};

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search cards, tags, notes...',
  visible = true,
  filters = [],
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
      className="w-full bg-zinc-950"
    >
      <View className="w-full flex-row items-center bg-zinc-950 px-6 py-5 border-t border-zinc-800 gap-4">
        <MagnifyingGlassIcon size={18} color="#E4E4E7" weight="bold" />
        <View className="flex-1 flex-row flex-wrap items-center gap-2">
          {filters.map((filter) => {
            const isTag = filter.kind === 'tag';
            const status = filter.status
              ? STATUS_FOLDERS.find((folder) => folder.key === filter.status)
              : null;
            const Icon = status ? statusIcons[status.key] : isTag ? HashIcon : FolderIcon;
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
                  className={`max-w-[180px] font-sans-medium text-lg ${isTag ? 'text-blue-300' : 'text-violet-300'}`}
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
            placeholderTextColor="#52525C"
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
            className="p-1.5 rounded-full bg-zinc-800 items-center justify-center active:opacity-70"
            accessibilityLabel="Clear search"
          >
            <XIcon size={12} color="#E4E4E7" weight="bold" />
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
