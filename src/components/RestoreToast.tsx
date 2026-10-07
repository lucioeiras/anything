import { ArrowCounterClockwiseIcon } from 'phosphor-react-native';
import { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Rect } from 'react-native-svg';

type RestoreToastProps = {
  visible: boolean;
  count: number;
  onRestore: () => void;
  onDismiss: () => void;
};

const STROKE_WIDTH = 3.5;
const DURATION_MS = 8000;

export function RestoreToast({ visible, count, onRestore, onDismiss }: RestoreToastProps) {
  const insets = useSafeAreaInsets();
  const [layout, setLayout] = useState({ width: 0, height: 0 });
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

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setLayout((prev) => {
        if (Math.abs(prev.width - width) < 0.5 && Math.abs(prev.height - height) < 0.5) {
          return prev;
        }
        return { width, height };
      });
    }
  };

  const hasLayout = layout.width > 0 && layout.height > 0;
  const halfStroke = STROKE_WIDTH / 2;
  const rectWidth = Math.max(0, layout.width - STROKE_WIDTH);
  const rectHeight = Math.max(0, layout.height - STROKE_WIDTH);
  const radius = rectHeight / 2;
  // Precise capsule perimeter: 2 straight horizontal segments + 2 half-circle ends
  const straightSegment = Math.max(0, rectWidth - rectHeight);
  const perimeter = 2 * straightSegment + Math.PI * rectHeight;
  const strokeDashoffset = perimeter * (1 - progress);

  return (
    <View
      style={{ bottom: Math.max(insets.bottom + 64, 80) }}
      className="absolute left-4 right-4 z-40 items-center"
      pointerEvents="box-none"
    >
      <View
        onLayout={handleLayout}
        className="w-full max-w-md relative items-center justify-center shadow-2xl"
      >
        {/* SVG background and animated border countdown */}
        {hasLayout && (
          <Svg
            width={layout.width}
            height={layout.height}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: layout.width,
              height: layout.height,
            }}
            pointerEvents="none"
          >
            {/* Background fill and subtle dark track */}
            <Rect
              x={halfStroke}
              y={halfStroke}
              width={rectWidth}
              height={rectHeight}
              rx={radius}
              ry={radius}
              fill="#18181b"
              stroke="#27272a"
              strokeWidth={STROKE_WIDTH}
            />
            {/* Thick white animated countdown border on all 4 sides */}
            <Rect
              x={halfStroke}
              y={halfStroke}
              width={rectWidth}
              height={rectHeight}
              rx={radius}
              ry={radius}
              fill="none"
              stroke="#ffffff"
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={`${perimeter} ${perimeter}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap={progress > 0.03 ? 'round' : 'butt'}
              strokeOpacity={progress > 0.005 ? 1 : 0}
            />
          </Svg>
        )}

        {/* Toast contents */}
        <View
          style={{
            backgroundColor: hasLayout ? 'transparent' : '#18181b',
            borderRadius: 9999,
          }}
          className="w-full flex-row items-center justify-between px-6 py-3.5 z-10"
        >
          <Text className="font-sans-semibold text-base text-white">
            Deleted {count} {count === 1 ? 'card' : 'cards'}
          </Text>

          <Pressable
            onPress={onRestore}
            hitSlop={8}
            className="flex-row items-center gap-2 bg-white active:bg-zinc-200 px-5 py-3 rounded-full"
          >
            <ArrowCounterClockwiseIcon size={16} color="#000000" weight="bold" />
            <Text className="font-sans-semibold text-base text-black">Restore</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
