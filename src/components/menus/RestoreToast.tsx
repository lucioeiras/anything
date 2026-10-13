import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';

type RestoreToastProps = {
  visible: boolean;
  count: number;
  bottomOffset?: number;
  onRestore: () => void;
  onDismiss: () => void;
};

const DURATION_MS = 5000;

export function RestoreToast({
  visible,
  count,
  bottomOffset = 0,
  onRestore,
  onDismiss,
}: RestoreToastProps) {
  const [progress, setProgress] = useState(1);
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!visible) return;

    const startTime = Date.now();
    let animationFrameId: number;
    let lastUpdate = startTime;

    const tick = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const remaining = Math.max(0, 1 - elapsed / DURATION_MS);

      if (now - lastUpdate >= 30 || remaining <= 0) {
        lastUpdate = now;
        setProgress(remaining);
      }

      if (elapsed < DURATION_MS) {
        animationFrameId = requestAnimationFrame(tick);
      } else {
        onDismissRef.current();
      }
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animationFrameId);
  }, [visible, count]);

  if (!visible) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        right: 0,
        bottom: bottomOffset,
        left: 0,
        alignItems: 'center',
      }}
    >
      <View
        className="relative flex-row items-center gap-20 overflow-hidden rounded-full border border-white/10 px-2 py-2"
        style={{ backgroundColor: 'rgba(24, 24, 27, 0.88)' }}
      >
        <Text className="pl-2 font-sans-medium text-base text-zinc-300 ml-2">
          You deleted <Text className="font-sans-bold text-white">{count}</Text>{' '}
          {count === 1 ? 'card' : 'cards'}
        </Text>

        <Button
          accessibilityLabel="Restore deleted cards"
          variant="primary"
          icon={undefined}
          text="Restore"
          onPress={onRestore}
          shadowColor="#FFFFFF"
          shadowOpacity={0.16}
        />

        <View
          pointerEvents="none"
          className="absolute bottom-0 left-0 h-[2px] bg-white"
          style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }}
        />
      </View>
    </View>
  );
}
