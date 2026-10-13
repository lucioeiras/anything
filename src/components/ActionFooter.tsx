import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

type ActionFooterProps = {
  children: ReactNode;
  bottomInset?: number;
  overlay?: boolean;
  horizontalScroll?: boolean;
};

/** Floating, transparent action row shared by card details and modal forms. */
export function ActionFooter({
  children,
  bottomInset = 0,
  overlay = false,
  horizontalScroll = false,
}: ActionFooterProps) {
  return (
    <View
      pointerEvents="box-none"
      style={{
        marginHorizontal: horizontalScroll ? 4 : 12,
        marginBottom: Math.max(bottomInset, 12),
        backgroundColor: 'transparent',
        ...(overlay ? { position: 'absolute', right: 0, bottom: 0, left: 0, zIndex: 20 } : null),
      }}
    >
      {horizontalScroll ? (
        <ScrollView
          horizontal
          className="w-full flex-grow-0"
          contentContainerStyle={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingHorizontal: 8,
          }}
          keyboardShouldPersistTaps="always"
          showsHorizontalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View className="w-full flex-row flex-wrap items-center justify-center gap-3 bg-transparent">
          {children}
        </View>
      )}
    </View>
  );
}
