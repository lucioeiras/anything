import { MagnifyingGlassIcon, XIcon } from 'phosphor-react-native';
import { useRef } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  visible?: boolean;
};

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search cards, tags, notes...',
  visible = true,
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
      <View className="w-full flex-row items-center bg-zinc-950 px-6 py-6 border-t border-zinc-800 gap-4">
        <MagnifyingGlassIcon size={18} color="#E4E4E7" weight="bold" />
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="52525C"
          className="flex-1 font-sans text-2xl text-white leading-tight"
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="never"
        />
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
