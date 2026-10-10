export type LocalModelConfig = {
  id: string;
  name: string;
  displayName: string;
  description: string;
  fileName: string;
  downloadUrl: string;
  sizeBytes: number;
  sizeFormatted: string;
};

export type DownloadProgressState = {
  isDownloading: boolean;
  progress: number; // 0 to 1
  bytesWritten: number;
  totalBytes: number;
  error?: string | null;
};

export const DEFAULT_LOCAL_MODEL: LocalModelConfig = {
  id: 'qwen2.5-0.5b',
  name: 'Qwen 2.5 0.5B Instruct',
  displayName: 'Qwen 2.5 (0.5B)',
  description: 'Modelo local compacto de alta precisão com suporte a PT-BR e aceleração Metal GPU.',
  fileName: 'qwen2.5-0.5b-instruct-q4_k_m.gguf',
  downloadUrl:
    'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf',
  sizeBytes: 417000000,
  sizeFormatted: '~398 MB',
};
