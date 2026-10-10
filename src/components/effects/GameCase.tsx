import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type GameCaseProps = {
  children: ReactNode;
  platformLabel?: string;
};

/** A compact, physical-looking game case: blue shell, cover insert and plastic reflections. */
export function GameCase({ children, platformLabel = 'GAME' }: GameCaseProps) {
  return (
    <View style={styles.case}>
      <View style={styles.shellShadow} />
      <View style={styles.blueShell} />

      <View style={styles.spine} pointerEvents="none">
        <LinearGradient
          colors={['#0B2A66', '#1E67D2', '#0D3D91']}
          locations={[0, 0.52, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.spineHighlight} />
      </View>

      <View style={styles.coverWindow}>
        <View style={styles.platformBand}>
          <Text numberOfLines={1} style={styles.platformLabel}>
            {platformLabel}
          </Text>
          <View style={styles.platformRule} />
        </View>
        <View style={styles.artwork}>{children}</View>

        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={styles.clearTopLip} />
          <View style={styles.clearLeftLip} />
          <LinearGradient
            colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.03)', 'transparent']}
            locations={[0, 0.25, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.plasticReflection}
          />
          <View style={styles.coverInset} />
        </View>
      </View>

      <View pointerEvents="none" style={styles.rightPlasticEdge} />
      <View pointerEvents="none" style={styles.bottomPlasticEdge} />
    </View>
  );
}

const styles = StyleSheet.create({
  case: { width: '100%', aspectRatio: 0.68, position: 'relative' },
  shellShadow: {
    ...StyleSheet.absoluteFill,
    top: 3,
    left: 3,
    backgroundColor: '#061B45',
    borderRadius: 7,
    shadowColor: '#000000',
    shadowOffset: { width: 5, height: 7 },
    shadowOpacity: 0.42,
    shadowRadius: 8,
    elevation: 8,
  },
  blueShell: {
    ...StyleSheet.absoluteFill,
    borderRadius: 7,
    backgroundColor: '#1769DC',
    borderWidth: 1,
    borderColor: '#5AA2FF',
  },
  spine: {
    position: 'absolute',
    top: 4,
    bottom: 5,
    left: 3,
    width: '8%',
    overflow: 'hidden',
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  spineHighlight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 2,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.42)',
  },
  coverWindow: {
    position: 'absolute',
    top: '6.5%',
    right: '4.5%',
    bottom: '4.5%',
    left: '8%',
    overflow: 'hidden',
    borderRadius: 3,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: 'rgba(196,225,255,0.82)',
  },
  platformBand: {
    height: '10.5%',
    backgroundColor: '#F5F8FC',
    justifyContent: 'center',
    paddingHorizontal: 9,
    borderBottomWidth: 2,
    borderBottomColor: '#1954AE',
  },
  platformLabel: {
    color: '#0B1530',
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  platformRule: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  artwork: {
    position: 'absolute',
    top: '10.5%',
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    backgroundColor: '#111827',
  },
  clearTopLip: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    height: 2,
    backgroundColor: 'rgba(194,227,255,0.9)',
  },
  clearLeftLip: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    left: 1,
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  plasticReflection: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: '16%',
  },
  coverInset: {
    ...StyleSheet.absoluteFill,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.22)',
  },
  rightPlasticEdge: {
    position: 'absolute',
    top: 6,
    right: 1,
    bottom: 7,
    width: 2,
    backgroundColor: 'rgba(189,224,255,0.72)',
  },
  bottomPlasticEdge: {
    position: 'absolute',
    right: 5,
    bottom: 2,
    left: 5,
    height: 2,
    backgroundColor: 'rgba(6,43,111,0.75)',
  },
});
