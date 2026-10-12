import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { VideoCard } from '@/components/cards/VideoCard';

const mockListeners: Record<string, (payload: any) => void> = {};
const mockPlayer = {
  loop: false,
  playing: false,
  videoTrack: { size: { width: 1080, height: 1920 } },
  play: jest.fn(),
  pause: jest.fn(),
  addListener: jest.fn((event: string, listener: (payload: any) => void) => {
    mockListeners[event] = listener;
    return { remove: jest.fn() };
  }),
};

jest.mock('expo-video', () => ({
  useVideoPlayer: () => mockPlayer,
  VideoView: ({ style }: { style: object }) => {
    const { View } = jest.requireActual('react-native');
    return <View testID="video-view" style={style} />;
  },
}));

describe('VideoCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete mockListeners.videoTrackChange;
    delete mockListeners.playingChange;
    mockPlayer.videoTrack = { size: { width: 1080, height: 1920 } };
    mockPlayer.playing = false;
  });

  it('keeps the source aspect ratio and starts playback from the play overlay', async () => {
    const { getByTestId, getByLabelText } = await render(
      <VideoCard uri="file:///portrait.mp4" title="Portrait clip" />
    );

    await waitFor(() =>
      expect(getByTestId('video-view').props.style).toMatchObject({ aspectRatio: 1080 / 1920 })
    );
    await fireEvent.press(getByLabelText('Play video'));
    expect(mockPlayer.play).toHaveBeenCalledTimes(1);
  });

  it('hides the play overlay while the video is playing', async () => {
    const { getByLabelText, queryByLabelText } = await render(<VideoCard uri="file:///clip.mp4" />);
    expect(getByLabelText('Play video')).toBeTruthy();

    await waitFor(() => expect(mockListeners.playingChange).toBeDefined());
    await act(async () => {
      mockListeners.playingChange({ isPlaying: true });
    });
    await waitFor(() => expect(queryByLabelText('Play video')).toBeNull());
  });
});
