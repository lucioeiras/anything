import { ArrowCounterClockwiseIcon } from 'phosphor-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

type RestoreToastProps = {
  visible: boolean;
  count: number;
  onRestore: () => void;
  onDismiss: () => void;
};

const DURATION_MS = 5000;

export function RestoreToast({ visible, count, onRestore, onDismiss }: RestoreToastProps) {
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

      // Throttle updates to ~30 FPS for silky-smooth performance with minimal overhead
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

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [visible, count]);

  if (!visible) return null;

  return (
    <View
      style={{ bottom: 64 }}
      className="w-full absolute left-0 right-0 z-40 items-center"
      pointerEvents="box-none"
    >
      <View className="w-full relative bg-zinc-950 border-t border-b border-zinc-800 flex-row items-center justify-between pl-8 overflow-hidden">
        {/* Animated countdown progress bar on border top */}
        <View
          style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }}
          className="absolute top-0 left-0 h-[2px] bg-white z-20"
        />

        <Text className="font-sans-medium text-base text-zinc-400">
          You deleted <Text className="font-sans-bold text-white">{count}</Text>{' '}
          {count === 1 ? 'card' : 'cards'}
        </Text>

        <Pressable
          onPress={onRestore}
          hitSlop={8}
          className="flex-row items-center gap-2 bg-zinc-950 active:bg-zinc-900 py-6 px-6 border-l border-zinc-800"
          accessibilityRole="button"
          accessibilityLabel="Restore deleted cards"
        >
          <ArrowCounterClockwiseIcon size={16} color="#FFFFFF" weight="bold" />
          <Text className="font-sans-bold text-sm text-white">Restore</Text>
        </Pressable>
      </View>
    </View>
  );
}
