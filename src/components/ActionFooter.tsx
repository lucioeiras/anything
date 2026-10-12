import type { ReactNode } from 'react';
import { View } from 'react-native';

type ActionFooterProps = {
  children: ReactNode;
  bottomInset?: number;
  overlay?: boolean;
};

/** Floating, transparent action row shared by card details and modal forms. */
export function ActionFooter({ children, bottomInset = 0, overlay = false }: ActionFooterProps) {
  return (
    <View
      pointerEvents="box-none"
      style={{
        marginHorizontal: 32,
        marginBottom: Math.max(bottomInset, 12),
        backgroundColor: 'transparent',
        ...(overlay ? { position: 'absolute', right: 0, bottom: 0, left: 0 } : null),
      }}
    >
      <View className="w-full flex-row flex-wrap items-center justify-center gap-3 bg-transparent">
        {children}
      </View>
    </View>
  );
}
