import { Directory, DownloadTask, File, Paths } from 'expo-file-system';
import {
  DEFAULT_LOCAL_MODEL,
  DEFAULT_WHISPER_MODEL,
  type DownloadProgressState,
  type LocalModelConfig,
} from './types';

export class LocalModelManager {
  constructor(private readonly defaultConfig: LocalModelConfig = DEFAULT_LOCAL_MODEL) {}

  private activeDownloadTask: DownloadTask | null = null;
  private cancelledDownloadTask: DownloadTask | null = null;
  private progressListeners = new Set<(state: DownloadProgressState) => void>();
  private currentProgress: DownloadProgressState = {
    isDownloading: false,
    progress: 0,
    bytesWritten: 0,
    totalBytes: 0,
    error: null,
  };

  private getModelsDirectory(): Directory {
    const dir = new Directory(Paths.document, 'models');
    if (!dir.exists) {
      dir.create({ intermediates: true });
    }
    return dir;
  }

  public getModelFile(config: LocalModelConfig = this.defaultConfig): File {
    const dir = this.getModelsDirectory();
    return new File(dir, config.fileName);
  }

  public isModelDownloaded(config: LocalModelConfig = this.defaultConfig): boolean {
    try {
      const file = this.getModelFile(config);
      return file.exists && (file.size ?? 0) > 1000000; // at least 1MB
    } catch {
      return false;
    }
  }

  public getModelSize(config: LocalModelConfig = this.defaultConfig): number {
    try {
      const file = this.getModelFile(config);
      return file.exists ? (file.size ?? 0) : 0;
    } catch {
      return 0;
    }
  }

  public getProgress(): DownloadProgressState {
    return { ...this.currentProgress };
  }

  public subscribeProgress(listener: (state: DownloadProgressState) => void): () => void {
    this.progressListeners.add(listener);
    listener(this.currentProgress);
    return () => {
      this.progressListeners.delete(listener);
    };
  }

  private notify(state: Partial<DownloadProgressState>) {
    this.currentProgress = { ...this.currentProgress, ...state };
    for (const listener of this.progressListeners) {
      listener(this.currentProgress);
    }
  }

  public async downloadModel(config: LocalModelConfig = this.defaultConfig): Promise<File | null> {
    if (this.activeDownloadTask) {
      return null;
    }

    if (this.isModelDownloaded(config)) {
      this.notify({ isDownloading: false, progress: 1, error: null });
      return this.getModelFile(config);
    }

    const destinationFile = this.getModelFile(config);

    this.notify({
      isDownloading: true,
      progress: 0,
      bytesWritten: 0,
      totalBytes: config.sizeBytes,
      error: null,
    });

    let task: DownloadTask | null = null;
    try {
      task = new DownloadTask(config.downloadUrl, destinationFile, {
        onProgress: (event) => {
          const written = event.bytesWritten;
          const total = event.totalBytes > 0 ? event.totalBytes : config.sizeBytes;
          const pct = total > 0 ? Math.min(1, Math.max(0, written / total)) : 0;

          this.notify({
            isDownloading: true,
            progress: pct,
            bytesWritten: written,
            totalBytes: total,
            error: null,
          });
        },
      });

      this.activeDownloadTask = task;
      const result = await task.downloadAsync();
      if (this.activeDownloadTask === task) this.activeDownloadTask = null;
      if (this.cancelledDownloadTask === task) this.cancelledDownloadTask = null;

      if (result && result.exists) {
        this.notify({
          isDownloading: false,
          progress: 1,
          bytesWritten: result.size ?? config.sizeBytes,
          totalBytes: result.size ?? config.sizeBytes,
          error: null,
        });
        return result;
      } else {
        throw new Error('Download incomplete');
      }
    } catch (e) {
      const wasCancelled = task !== null && this.cancelledDownloadTask === task;
      if (this.activeDownloadTask === task) this.activeDownloadTask = null;
      if (this.cancelledDownloadTask === task) this.cancelledDownloadTask = null;

      // Clean up partial file on failure
      try {
        if (destinationFile.exists) {
          destinationFile.delete();
        }
      } catch {
        // ignore delete error
      }

      if (wasCancelled) {
        this.notify({
          isDownloading: false,
          progress: 0,
          bytesWritten: 0,
          totalBytes: 0,
          error: null,
        });
        return null;
      }

      const msg = e instanceof Error ? e.message : 'Falha ao baixar o modelo';
      this.notify({ isDownloading: false, error: msg });
      throw e;
    }
  }

  public cancelDownload(): void {
    if (this.activeDownloadTask) {
      this.cancelledDownloadTask = this.activeDownloadTask;
      this.activeDownloadTask.cancel();
    }
  }

  public async deleteModel(config: LocalModelConfig = this.defaultConfig): Promise<boolean> {
    try {
      this.cancelDownload();
      const file = this.getModelFile(config);
      if (file.exists) {
        file.delete();
      }
      this.notify({
        isDownloading: false,
        progress: 0,
        bytesWritten: 0,
        totalBytes: 0,
        error: null,
      });
      return true;
    } catch {
      return false;
    }
  }
}

export const localModelManager = new LocalModelManager();
export const whisperModelManager = new LocalModelManager(DEFAULT_WHISPER_MODEL);
