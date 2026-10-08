import { MagnifyingGlassIcon, XIcon } from 'phosphor-react-native';
import { useRef } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type FloatingSearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  visible?: boolean;
};

export function FloatingSearchBar({
  value,
  onChangeText,
  placeholder = 'Search cards, tags, notes...',
  visible = true,
}: FloatingSearchBarProps) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  if (!visible) return null;

  // Resting position: sits comfortably above the transparent bottom tabs bar.
  // In iOS tabs, insets.bottom is around 34, so ~80-92pt from bottom of screen.
  const bottomOffset = Math.max(insets.bottom + 58, 68);

  const handleClear = () => {
    onChangeText('');
    inputRef.current?.focus();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? -bottomOffset + 12 : 0}
      className="absolute inset-x-0 bottom-0 z-30"
      pointerEvents="box-none"
    >
      <View
        style={{ paddingBottom: bottomOffset }}
        className="w-full px-3 items-center"
        pointerEvents="box-none"
      >
        <View className="w-full flex-row items-center rounded-full bg-zinc-900 px-6 py-5 shadow-2xl gap-4 mb-2">
          <MagnifyingGlassIcon size={18} color="#a1a1aa" weight="bold" />
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#71717a"
            className="flex-1 font-sans text-xl text-white leading-tight"
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="never"
          />
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
    </KeyboardAvoidingView>
  );
}
