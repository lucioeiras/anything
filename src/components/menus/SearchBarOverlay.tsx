import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';

const SearchBarOverlayContext = createContext<Dispatch<SetStateAction<ReactNode>> | null>(null);

export function SearchBarOverlayProvider({ children }: { children: ReactNode }) {
  const [overlay, setOverlay] = useState<ReactNode>(null);

  return (
    <SearchBarOverlayContext.Provider value={setOverlay}>
      <View className="flex-1">{children}</View>
      <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, styles.overlay]}>
        {overlay}
      </View>
    </SearchBarOverlayContext.Provider>
  );
}

export function useSearchBarOverlay() {
  const setOverlay = useContext(SearchBarOverlayContext);
  if (!setOverlay) {
    throw new Error('useSearchBarOverlay must be used inside SearchBarOverlayProvider');
  }
  return setOverlay;
}

const styles = StyleSheet.create({
  overlay: {
    zIndex: 1000,
    elevation: 1000,
  },
});
