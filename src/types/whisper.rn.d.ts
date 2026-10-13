declare module 'whisper.rn' {
  export type WhisperTranscriptionResult = { result: string };

  export type WhisperContext = {
    transcribe(
      filePath: string,
      options?: { language?: string; maxThreads?: number }
    ): { promise: Promise<WhisperTranscriptionResult> };
    release(): Promise<void>;
  };

  export function initWhisper(options: {
    filePath: string;
    useGpu?: boolean;
    nThreads?: number;
  }): Promise<WhisperContext>;
}
