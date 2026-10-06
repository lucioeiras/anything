import { registerWebModule, NativeModule } from 'expo';

class AnythingLibraryAccessModule extends NativeModule<{}> {}

export default registerWebModule(AnythingLibraryAccessModule, 'AnythingLibraryAccessModule');
