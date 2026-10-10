import { Image as ExpoImage } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

type VinylRecordProps = {
  size: number;
  coverUri?: string;
  isSpinning?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function VinylRecord({ size, coverUri, isSpinning = false, style }: VinylRecordProps) {
  const [spinAnim] = useState(() => new Animated.Value(0));
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isSpinning) {
      animRef.current = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 3500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      animRef.current.start();
    } else {
      animRef.current?.stop();
      spinAnim.setValue(0);
    }

    return () => {
      animRef.current?.stop();
    };
  }, [isSpinning, spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const center = size / 2;
  const labelSize = Math.round(size * 0.38);
  const holeSize = Math.max(8, Math.round(size * 0.08));

  // Concentric groove radiuses (normalized from 0.44 to 0.95 of center)
  const grooveRatios = [
    0.44, 0.47, 0.5, 0.53, 0.56, 0.59, 0.62, 0.65, 0.68, 0.71, 0.74, 0.77, 0.8, 0.83, 0.86, 0.89,
    0.92, 0.95, 0.98,
  ];

  return (
    <Animated.View
      style={[
        styles.discContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          transform: [{ rotate: spin }],
        },
        style,
      ]}
      pointerEvents="none"
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          {/* Subtle specular vinyl light reflection across diagonally opposite quadrants */}
          <LinearGradient id="vinylSheen1" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#ffffff" stopOpacity="0.12" />
            <Stop offset="0.3" stopColor="#ffffff" stopOpacity="0.02" />
            <Stop offset="0.5" stopColor="#000000" stopOpacity="0.25" />
            <Stop offset="0.7" stopColor="#ffffff" stopOpacity="0.02" />
            <Stop offset="1" stopColor="#ffffff" stopOpacity="0.12" />
          </LinearGradient>

          <LinearGradient id="vinylSheen2" x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0" stopColor="#ffffff" stopOpacity="0.08" />
            <Stop offset="0.35" stopColor="#000000" stopOpacity="0.2" />
            <Stop offset="0.5" stopColor="#ffffff" stopOpacity="0.03" />
            <Stop offset="0.65" stopColor="#000000" stopOpacity="0.2" />
            <Stop offset="1" stopColor="#ffffff" stopOpacity="0.08" />
          </LinearGradient>

          {/* Outer edge rim gradient */}
          <LinearGradient id="edgeGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#2c2c30" stopOpacity="1" />
            <Stop offset="1" stopColor="#141416" stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Base dark vinyl body */}
        <Circle
          cx={center}
          cy={center}
          r={center - 1}
          fill="#111113"
          stroke="#232326"
          strokeWidth={1}
        />

        {/* Vinyl sheen specular overlays */}
        <Circle cx={center} cy={center} r={center - 1} fill="url(#vinylSheen1)" />
        <Circle cx={center} cy={center} r={center - 1} fill="url(#vinylSheen2)" />

        {/* Concentric sound grooves */}
        {grooveRatios.map((ratio, index) => (
          <Circle
            key={index}
            cx={center}
            cy={center}
            r={center * ratio}
            fill="none"
            stroke={index % 3 === 0 ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.035)'}
            strokeWidth={0.8}
          />
        ))}

        {/* Run-out groove band right outside the center label */}
        <Circle
          cx={center}
          cy={center}
          r={center * 0.42}
          fill="none"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth={1.5}
        />

        {/* Outer label border groove */}
        <Circle
          cx={center}
          cy={center}
          r={labelSize / 2 + 1}
          fill="none"
          stroke="#27272a"
          strokeWidth={1.5}
        />
      </Svg>

      {/* Center Label (Selo central com a arte do álbum ou selo estilizado) */}
      <View
        style={[
          styles.centerLabel,
          {
            width: labelSize,
            height: labelSize,
            borderRadius: labelSize / 2,
            top: center - labelSize / 2,
            left: center - labelSize / 2,
          },
        ]}
      >
        {coverUri ? (
          <ExpoImage
            source={{ uri: coverUri }}
            style={{ width: '100%', height: '100%', borderRadius: labelSize / 2 }}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.fallbackLabel, { borderRadius: labelSize / 2 }]} />
        )}

        {/* Semi-transparent protective ring on the center label */}
        <View
          style={[
            styles.labelRing,
            {
              width: labelSize,
              height: labelSize,
              borderRadius: labelSize / 2,
            },
          ]}
        />

        {/* Center Spindle Hole (Furo central do toca-discos) */}
        <View
          style={[
            styles.spindleHole,
            {
              width: holeSize,
              height: holeSize,
              borderRadius: holeSize / 2,
              top: (labelSize - holeSize) / 2,
              left: (labelSize - holeSize) / 2,
            },
          ]}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  discContainer: {
    position: 'relative',
    backgroundColor: '#111113',
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#18181b',
    borderWidth: 1.5,
    borderColor: '#3f3f46',
  },
  fallbackLabel: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e11d48',
  },
  labelRing: {
    ...StyleSheet.absoluteFill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  spindleHole: {
    position: 'absolute',
    backgroundColor: '#09090b',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
});
