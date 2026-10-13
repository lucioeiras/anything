import { NativeModule, registerWebModule } from 'expo';

class AnythingAudioTranscriptionModule extends NativeModule {
  async convertToWav(): Promise<string> {
    throw new Error('Audio transcription is only available on iOS and Android.');
  }
}

export default registerWebModule(AnythingAudioTranscriptionModule, 'AnythingAudioTranscription');
