import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';

const FloatingTabOverlayContext = createContext<Dispatch<SetStateAction<ReactNode>> | null>(null);

export function FloatingTabOverlayProvider({ children }: { children: ReactNode }) {
  const [overlay, setOverlay] = useState<ReactNode>(null);

  return (
    <FloatingTabOverlayContext.Provider value={setOverlay}>
      <View className="flex-1">{children}</View>
      <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, styles.overlay]}>
        {overlay}
      </View>
    </FloatingTabOverlayContext.Provider>
  );
}

export function useFloatingTabOverlay() {
  const setOverlay = useContext(FloatingTabOverlayContext);
  if (!setOverlay) {
    throw new Error('useFloatingTabOverlay must be used inside FloatingTabOverlayProvider');
  }
  return setOverlay;
}

const styles = StyleSheet.create({
  overlay: {
    zIndex: 1000,
    elevation: 1000,
  },
});
