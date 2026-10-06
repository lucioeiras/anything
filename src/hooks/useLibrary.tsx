import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import {
  getFolderDisplayName,
  getLibraryDirectory,
  getRecentFolders,
  getSavedLibrarySource,
  loadLibrary,
  pickLibraryFolder,
  removeRecentFolder as removeRecentFolderStorage,
  resolveFolderSource,
  saveLibrarySource,
  saveRecentFolder,
  type LibrarySource,
  type LoadResult,
  type SavedFolder,
} from '@/lib/library/storage';

export type LibraryState =
  | { status: 'loading' }
  | { status: 'ready'; result: LoadResult }
  | { status: 'error'; error: string };

export type LibraryContextValue = {
  source: LibrarySource;
  setSource: (source: LibrarySource) => void;
  state: LibraryState;
  refresh: () => Promise<void>;
  refreshing: boolean;
  recentFolders: SavedFolder[];
  currentFolderName: string;
  selectFolder: (source: LibrarySource) => Promise<void>;
  pickAndOpenFolder: () => Promise<boolean>;
  removeRecentFolder: (id: string) => Promise<void>;
  isInitialized: boolean;
  hasSavedSource: boolean;
  shouldAutoOpenBoard: boolean;
  consumeAutoOpen: () => void;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [source, setSourceInternal] = useState<LibrarySource | null>(null);
  const [loaded, setLoaded] = useState<{ source: LibrarySource; state: LibraryState } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [recentFolders, setRecentFolders] = useState<SavedFolder[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasSavedSource, setHasSavedSource] = useState(false);
  const [shouldAutoOpenBoard, setShouldAutoOpenBoard] = useState(false);
  const hasConsumedAutoOpen = useRef(false);
  const requestId = useRef(0);

  const load = useCallback(async (src: LibrarySource) => {
    const id = ++requestId.current;
    let state: LibraryState;
    try {
      state = { status: 'ready', result: await loadLibrary(src) };
    } catch (e) {
      state = { status: 'error', error: e instanceof Error ? e.message : String(e) };
    }
    if (id === requestId.current) setLoaded({ source: src, state });
  }, []);

  useEffect(() => {
    let mounted = true;
    Promise.all([getSavedLibrarySource(), getRecentFolders()]).then(([savedSource, recents]) => {
      if (!mounted) return;
      if (savedSource) {
        const resolved = resolveFolderSource(savedSource);
        setSourceInternal(resolved);
        setHasSavedSource(true);
        if (!hasConsumedAutoOpen.current) {
          setShouldAutoOpenBoard(true);
        }
      }
      setRecentFolders(recents);
      setIsInitialized(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const consumeAutoOpen = useCallback(() => {
    hasConsumedAutoOpen.current = true;
    setShouldAutoOpenBoard(false);
  }, []);

  const setSource = useCallback((newSource: LibrarySource) => {
    hasConsumedAutoOpen.current = true;
    setShouldAutoOpenBoard(false);
    const resolved = resolveFolderSource(newSource);
    setSourceInternal(resolved);
    setHasSavedSource(true);
    saveLibrarySource(resolved);
    saveRecentFolder(resolved).then(setRecentFolders);
  }, []);

  const selectFolder = useCallback(async (newSource: LibrarySource) => {
    hasConsumedAutoOpen.current = true;
    setShouldAutoOpenBoard(false);
    const resolved = resolveFolderSource(newSource);
    setSourceInternal(resolved);
    setHasSavedSource(true);
    await saveLibrarySource(resolved);
    const updated = await saveRecentFolder(resolved);
    setRecentFolders(updated);
  }, []);

  const pickAndOpenFolder = useCallback(async (): Promise<boolean> => {
    try {
      hasConsumedAutoOpen.current = true;
      setShouldAutoOpenBoard(false);
      const picked = await pickLibraryFolder();
      setSourceInternal(picked);
      setHasSavedSource(true);
      const updated = await getRecentFolders();
      setRecentFolders(updated);
      return true;
    } catch {
      return false;
    }
  }, []);

  const removeRecentFolder = useCallback(
    async (id: string) => {
      const updated = await removeRecentFolderStorage(id);
      setRecentFolders(updated);
      if (source && source.kind === 'folder' && source.uri === id) {
        setSourceInternal(null);
        setHasSavedSource(false);
        try {
          await AsyncStorage.removeItem('anything:librarySource');
        } catch {
          // ignore
        }
      }
    },
    [source]
  );

  useEffect(() => {
    if (!source) return;

    let subscription: { remove(): void } | undefined;
    let cancelled = false;

    load(source).then(() => {
      const root = getLibraryDirectory(source);
      if (cancelled || !root.exists) return;
      try {
        subscription = root.watch(() => load(source), { debounce: 300 });
      } catch {
        // Watching is a nice-to-have; pull-to-refresh still works.
      }
    });

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [source, load]);

  const refresh = useCallback(async () => {
    if (!source) return;
    setRefreshing(true);
    await load(source);
    setRefreshing(false);
  }, [source, load]);

  const activeSource = source ?? { kind: 'local', name: 'App Library' };

  const state: LibraryState = !source
    ? { status: 'loading' }
    : loaded && loaded.source === source
      ? loaded.state
      : { status: 'loading' };

  const currentFolderName = getFolderDisplayName(activeSource);

  const value: LibraryContextValue = {
    source: activeSource,
    setSource,
    state,
    refresh,
    refreshing,
    recentFolders,
    currentFolderName,
    selectFolder,
    pickAndOpenFolder,
    removeRecentFolder,
    isInitialized,
    hasSavedSource,
    shouldAutoOpenBoard,
    consumeAutoOpen,
  };

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryContextValue {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
}
