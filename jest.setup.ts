jest.mock('nativewind', () => ({
  cssInterop: jest.fn(),
}));

jest.mock('expo-image', () => ({
  Image: require('react-native').Image,
}));

jest.mock('expo-video', () => ({
  useVideoPlayer: jest.fn(() => ({})),
  VideoView: () => null,
}));
