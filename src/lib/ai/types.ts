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

export const DEFAULT_WHISPER_MODEL: LocalModelConfig = {
  id: 'whisper-base-q5_1',
  name: 'Whisper Base Multilingual Q5_1',
  displayName: 'Whisper Base (multilingual)',
  description: 'Transcrição de áudio no dispositivo, com suporte a português e uso offline.',
  fileName: 'ggml-base-q5_1.bin',
  downloadUrl: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base-q5_1.bin',
  sizeBytes: 60000000,
  sizeFormatted: '~60 MB',
};
