import { BlurView } from 'expo-blur';
import { ReactElement, ReactNode, cloneElement, isValidElement } from 'react';
import { Pressable, Text, View } from 'react-native';

type ButtonProps = {
  accessibilityLabel: string;
  icon?: ReactNode;
  text?: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  backgroundColor?: string;
  contentColor?: string;
};

/** Rounded floating action with optional icon and text. */
export function Button({
  accessibilityLabel,
  icon,
  text,
  onPress,
  disabled = false,
  variant = 'secondary',
  backgroundColor = '#FFFFFF',
  contentColor,
}: ButtonProps) {
  const foreground = contentColor ?? (variant === 'primary' ? '#09090B' : '#FFFFFF');
  const iconElement = isValidElement<{ size?: number; color?: string }>(icon) ? icon : undefined;
  const normalizedIcon =
    iconElement && 'size' in iconElement.props
      ? cloneElement(iconElement as ReactElement<{ size?: number; color?: string }>, {
          size: 24,
          // color: foreground,
        })
      : icon;

  return (
    <View
      className="rounded-full"
      style={{
        flexGrow: 0,
        flexShrink: 0,
        flexBasis: 'auto',
        shadowRadius: 8,
        elevation: 6,
      }}
    >
      <Pressable
        onPress={onPress}
        disabled={disabled}
        className={`flex-row items-center justify-center gap-2 overflow-hidden rounded-full active:opacity-80 disabled:opacity-50 ${text ? 'px-5 py-3' : 'p-4'} ${variant === 'secondary' && 'border border-zinc-800'}`}
        style={variant === 'primary' ? { backgroundColor } : undefined}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
      >
        {variant === 'secondary' && (
          <>
            <BlurView
              intensity={32}
              tint="dark"
              pointerEvents="none"
              style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
            />
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                borderRadius: 999,
                backgroundColor: 'rgba(9, 9, 11, 0.1)',
              }}
            />
          </>
        )}
        {normalizedIcon}
        {text ? (
          <Text
            numberOfLines={1}
            style={{ color: foreground }}
            className="font-sans-semibold text-lg"
          >
            {text}
          </Text>
        ) : null}
      </Pressable>
    </View>
  );
}
