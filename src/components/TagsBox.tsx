import { HashIcon, TagIcon, XIcon } from 'phosphor-react-native';
import { useRef, useState } from 'react';
import {
  type LayoutChangeEvent,
  type NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputKeyPressEventData,
  View,
} from 'react-native';

export type TagsBoxProps = {
  /** Current array of tags */
  tags: string[];
  /** Array of automatically generated / smart tags */
  autoTags?: string[];
  /** Callback when tags list changes */
  onTagsChange?: (tags: string[] | ((prev: string[]) => string[])) => void;
  /** Callback when autoTags list changes */
  onAutoTagsChange?: (autoTags: string[] | ((prev: string[]) => string[])) => void;
  /** Controlled input value */
  tagInput?: string;
  /** Callback when tag input value changes */
  onTagInputChange?: (text: string) => void;
  /** Ref for the TextInput */
  inputRef?: React.RefObject<TextInput | null>;
  /** Placeholder when tags array is empty */
  placeholder?: string;
  /** Custom section header title */
  title?: string;
  /** Container className */
  containerClassName?: string;
  /** Optional className alias */
  className?: string;
  /** Whether to show the X remove icon on tag pills */
  showRemoveIcon?: boolean;
  /** Whether the text input can be edited */
  editable?: boolean;
  /** Callback when user hits enter on empty input */
  onSubmitEditing?: () => void;
  /** Custom callback when adding a single tag */
  onAddTag?: (tag: string) => void;
  /** Custom callback when removing a tag */
  onRemoveTag?: (tag: string, index: number) => void;
  /** Custom press handler on a tag pill */
  onTagPress?: (tag: string, index: number) => void;
  /** Custom long press handler on a tag pill */
  onTagLongPress?: (tag: string, index: number) => void;
  /** Custom press handler on the tags box container */
  onContainerPress?: () => void;
  /** Callback when the text input is focused */
  onInputFocus?: () => void;
  /** Callback for layout measurement */
  onLayout?: (e: LayoutChangeEvent) => void;
  /** Custom wrapper around each tag pill */
  renderTagWrapper?: (tag: string, index: number, children: React.ReactNode) => React.ReactNode;
};

export function TagsBox({
  tags,
  autoTags,
  onTagsChange,
  onAutoTagsChange,
  tagInput: tagInputProp,
  onTagInputChange: onTagInputChangeProp,
  inputRef,
  placeholder,
  title,
  className,
  containerClassName,
  showRemoveIcon = true,
  editable = true,
  onSubmitEditing,
  onAddTag,
  onRemoveTag,
  onTagPress,
  onTagLongPress,
  onContainerPress,
  onInputFocus,
  onLayout,
  renderTagWrapper,
}: TagsBoxProps) {
  const fallbackInputRef = useRef<TextInput>(null);
  const effectiveInputRef = inputRef ?? fallbackInputRef;

  const [internalTagInput, setInternalTagInput] = useState('');
  const isControlled = tagInputProp !== undefined;
  const effectiveTagInput = isControlled ? tagInputProp : internalTagInput;

  const setTagInput = (text: string) => {
    if (isControlled) {
      onTagInputChangeProp?.(text);
    } else {
      setInternalTagInput(text);
    }
  };

  const handleRemoveTag = (indexToRemove: number) => {
    const removed = tags[indexToRemove];
    if (!removed) return;

    if (onRemoveTag) {
      onRemoveTag(removed, indexToRemove);
    }
    if (onTagsChange) {
      onTagsChange((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    }
    if (onAutoTagsChange) {
      onAutoTagsChange((prev) => prev.filter((t) => t !== removed));
    }
  };

  const handleTagInputChange = (text: string) => {
    if (text.includes(' ') || text.includes(',')) {
      const parts = text.split(/[\s,]+/);
      const endsWithDelimiter = text.endsWith(' ') || text.endsWith(',');
      const tokensToAdd = endsWithDelimiter
        ? parts.filter(Boolean)
        : parts.slice(0, -1).filter(Boolean);
      const remainder = endsWithDelimiter ? '' : parts[parts.length - 1];

      if (tokensToAdd.length > 0) {
        if (onAddTag) {
          for (const token of tokensToAdd) {
            const clean = token.replace(/^#/, '').trim();
            if (clean && !tags.includes(clean)) {
              onAddTag(clean);
            }
          }
        } else if (onTagsChange) {
          onTagsChange((prev) => {
            const next = [...prev];
            for (const token of tokensToAdd) {
              const clean = token.replace(/^#/, '').trim();
              if (clean && !next.includes(clean)) {
                next.push(clean);
              }
            }
            return next;
          });
        }
      }
      setTagInput(remainder);
    } else {
      setTagInput(text);
    }
  };

  const handleTagInputKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === 'Backspace' && effectiveTagInput === '' && tags.length > 0) {
      handleRemoveTag(tags.length - 1);
    }
  };

  const handleTagInputSubmit = () => {
    const clean = effectiveTagInput.replace(/^#/, '').trim();
    if (clean) {
      if (!tags.includes(clean)) {
        if (onAddTag) {
          onAddTag(clean);
        } else if (onTagsChange) {
          onTagsChange((prev) => [...prev, clean]);
        }
      }
      setTagInput('');
    } else {
      onSubmitEditing?.();
    }
  };

  const baseContainerClass =
    containerClassName ?? className ?? 'py-6 px-8 border-b border-zinc-800 gap-4';

  return (
    <View onLayout={onLayout} className={baseContainerClass}>
      {/* Header */}
      <View className="flex-row items-center gap-2">
        <TagIcon size={14} color="#E4E4E7" weight="bold" />
        <Text className="font-sans-semibold text-sm tracking-wider uppercase text-zinc-200">
          {title ?? `Tags${tags.length > 0 ? ` (${tags.length})` : ''}`}
        </Text>
      </View>

      {/* Tags & Input Container */}
      <Pressable
        onPress={() => {
          if (onContainerPress) {
            onContainerPress();
          } else {
            effectiveInputRef.current?.focus();
          }
        }}
        className="w-full flex-row flex-wrap gap-y-3 items-center gap-2 min-h-[28px]"
      >
        {tags.map((tag, idx) => {
          const isAuto = autoTags?.includes(tag);

          const pill = (
            <Pressable
              key={`${tag}-${idx}`}
              onPress={() => {
                if (onTagPress) {
                  onTagPress(tag, idx);
                } else {
                  handleRemoveTag(idx);
                }
              }}
              onLongPress={onTagLongPress ? () => onTagLongPress(tag, idx) : undefined}
              delayLongPress={250}
              className={`flex-row items-center gap-2 rounded-full px-3 py-1 active:opacity-70 ${
                isAuto ? 'bg-white' : 'bg-blue-500/15'
              }`}
            >
              <HashIcon size={12} color={isAuto ? '#52525C' : '#60A5FA'} weight="bold" />
              <Text
                className={`font-sans-medium text-base ${isAuto ? 'text-black' : 'text-blue-400'}`}
              >
                {tag}
              </Text>
              {showRemoveIcon && <XIcon size={14} color={isAuto ? '#000000' : '#60A5FA'} />}
            </Pressable>
          );

          return renderTagWrapper ? renderTagWrapper(tag, idx, pill) : pill;
        })}

        {editable && (
          <TextInput
            ref={effectiveInputRef}
            value={effectiveTagInput}
            onFocus={onInputFocus}
            onChangeText={handleTagInputChange}
            onKeyPress={handleTagInputKeyPress}
            placeholder={tags.length === 0 ? (placeholder ?? 'Add tags here...') : '+ Add more'}
            placeholderTextColor="#71717A"
            returnKeyType="done"
            onSubmitEditing={handleTagInputSubmit}
            className={`font-sans text-lg leading-tight text-zinc-200 flex-grow min-w-[120px] ${tags.length === 0 ? '' : 'ml-2'}`}
            style={styles.borderlessInput}
            underlineColorAndroid="transparent"
            autoCapitalize="none"
            autoCorrect={false}
          />
        )}
      </Pressable>
    </View>
  );
}

export const TagBox = TagsBox;

const styles = StyleSheet.create({
  borderlessInput: {
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
});
