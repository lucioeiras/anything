import { BlurView } from 'expo-blur';
import { ReactElement, ReactNode, cloneElement, isValidElement } from 'react';
import { Pressable, Text, View } from 'react-native';

type ButtonProps = {
  accessibilityLabel: string;
  icon?: ReactNode;
  text?: string;
  onPress: () => void;
  disabled?: boolean;
  size?: 'default' | 'small';
  variant?: 'primary' | 'secondary';
  backgroundColor?: string;
  contentColor?: string;
  shadowColor?: string;
  shadowOpacity?: number;
};

/** Rounded floating action with optional icon and text. */
export function Button({
  accessibilityLabel,
  icon,
  text,
  onPress,
  disabled = false,
  size = 'default',
  variant = 'secondary',
  backgroundColor = '#FFFFFF',
  contentColor,
  shadowColor = '#FFFFFF',
  shadowOpacity = 0,
}: ButtonProps) {
  const foreground = contentColor ?? (variant === 'primary' ? '#09090B' : '#FFFFFF');
  const isSmall = size === 'small';
  const iconElement = isValidElement<{ size?: number; color?: string }>(icon) ? icon : undefined;
  const normalizedIcon =
    iconElement && 'size' in iconElement.props
      ? cloneElement(iconElement as ReactElement<{ size?: number; color?: string }>, {
          size: isSmall ? 20 : 24,
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
        shadowColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity,
        shadowRadius: 8,
        elevation: 6,
      }}
    >
      <Pressable
        onPress={onPress}
        disabled={disabled}
        className={`flex-row items-center justify-center overflow-hidden rounded-full active:opacity-80 disabled:opacity-50 ${isSmall ? 'gap-2' : 'gap-3'} ${text ? (isSmall ? 'px-4 py-2' : 'px-6 py-3') : isSmall ? 'p-3' : 'p-4'} ${variant === 'secondary' && 'border border-white/10'}`}
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
            className={`font-sans-semibold ${isSmall ? 'text-sm' : 'text-lg'}`}
          >
            {text}
          </Text>
        ) : null}
      </Pressable>
    </View>
  );
}
