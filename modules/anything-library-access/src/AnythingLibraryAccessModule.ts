import { NativeModule, requireNativeModule } from 'expo';

declare class AnythingLibraryAccessModule extends NativeModule {
  bookmarkFolder(uri: string): string | null;
  resolveBookmark(base64: string): string | null;
}

export default requireNativeModule<AnythingLibraryAccessModule>('AnythingLibraryAccess');
