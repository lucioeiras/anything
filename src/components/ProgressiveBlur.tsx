import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView, type BlurTint } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactElement } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ProgressiveBlurProps = {
  /**
   * Height of the progressive blur overlay in points.
   * @default 160
   */
  height?: number;
  /**
   * Blur intensity (1 to 100).
   * @default 80
   */
  intensity?: number;
  /**
   * Blur tint.
   * @default 'dark'
   */
  tint?: BlurTint;
  style?: StyleProp<ViewStyle>;
};

export function ProgressiveBlur({
  height = 160,
  intensity = 80,
  tint = 'dark',
  style,
}: ProgressiveBlurProps): ReactElement {
  const insets = useSafeAreaInsets();
  const totalHeight = height + insets.bottom;

  return (
    <View
      pointerEvents="none"
      aria-hidden={true}
      style={[styles.container, { height: totalHeight }, style]}
    >
      <MaskedView
        style={StyleSheet.absoluteFill}
        maskElement={
          <LinearGradient
            colors={[
              'rgba(0, 0, 0, 0)',
              'rgba(0, 0, 0, 0.05)',
              'rgba(0, 0, 0, 0.2)',
              'rgba(0, 0, 0, 0.5)',
              'rgba(0, 0, 0, 0.8)',
              'rgba(0, 0, 0, 1)',
            ]}
            locations={[0, 0.2, 0.4, 0.6, 0.8, 1]}
            style={StyleSheet.absoluteFill}
          />
        }
      >
        <BlurView intensity={intensity} tint={tint} style={StyleSheet.absoluteFill} />
      </MaskedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 10,
  },
});
