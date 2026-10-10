import { useEffect, useState, useCallback } from 'react';
import { localModelManager } from './localModelManager';
import { localLlamaEngine } from './localLlamaEngine';
import { DEFAULT_LOCAL_MODEL, type DownloadProgressState } from './types';

export function useLocalAI() {
  const [isDownloaded, setIsDownloaded] = useState<boolean>(() =>
    localModelManager.isModelDownloaded()
  );
  const [downloadState, setDownloadState] = useState<DownloadProgressState>(() =>
    localModelManager.getProgress()
  );

  useEffect(() => {
    const unsubscribe = localModelManager.subscribeProgress((state) => {
      setDownloadState(state);
      if (state.progress === 1 && !state.isDownloading) {
        setIsDownloaded(true);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const downloadModel = useCallback(async () => {
    try {
      await localModelManager.downloadModel();
      setIsDownloaded(true);
    } catch (e) {
      console.warn('Download model error:', e);
    }
  }, []);

  const cancelDownload = useCallback(() => {
    localModelManager.cancelDownload();
  }, []);

  const deleteModel = useCallback(async () => {
    await localLlamaEngine.releaseContext();
    const success = await localModelManager.deleteModel();
    if (success) {
      setIsDownloaded(false);
    }
    return success;
  }, []);

  return {
    modelConfig: DEFAULT_LOCAL_MODEL,
    isDownloaded,
    isDownloading: downloadState.isDownloading,
    progress: downloadState.progress,
    bytesWritten: downloadState.bytesWritten,
    totalBytes: downloadState.totalBytes,
    error: downloadState.error,
    downloadModel,
    cancelDownload,
    deleteModel,
  };
}
