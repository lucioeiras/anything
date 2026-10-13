import { NativeModule, requireNativeModule } from 'expo';

declare class AnythingAudioTranscriptionModule extends NativeModule {
  convertToWav(inputPath: string, outputPath: string): Promise<string>;
}

export default requireNativeModule<AnythingAudioTranscriptionModule>('AnythingAudioTranscription');
