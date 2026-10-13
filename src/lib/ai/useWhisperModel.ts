import { useCallback, useEffect, useState } from 'react';

import { whisperModelManager } from './localModelManager';
import { DEFAULT_WHISPER_MODEL, type DownloadProgressState } from './types';

export function useWhisperModel() {
  const [isDownloaded, setIsDownloaded] = useState(() => whisperModelManager.isModelDownloaded());
  const [downloadState, setDownloadState] = useState<DownloadProgressState>(() =>
    whisperModelManager.getProgress()
  );

  useEffect(() => whisperModelManager.subscribeProgress(setDownloadState), []);

  const downloadModel = useCallback(async () => {
    try {
      await whisperModelManager.downloadModel();
      setIsDownloaded(whisperModelManager.isModelDownloaded());
    } catch {
      // The download error is exposed through downloadState for Settings.
    }
  }, []);

  const cancelDownload = useCallback(() => whisperModelManager.cancelDownload(), []);
  const deleteModel = useCallback(async () => {
    const success = await whisperModelManager.deleteModel();
    if (success) setIsDownloaded(false);
    return success;
  }, []);

  return {
    modelConfig: DEFAULT_WHISPER_MODEL,
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
