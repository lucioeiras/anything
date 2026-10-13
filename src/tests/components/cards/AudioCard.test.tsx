import { fireEvent, render } from '@testing-library/react-native';
import { AudioCard } from '@/components/cards/AudioCard';

const mockPlayer = {
  playbackRate: 1,
  setPlaybackRate: jest.fn(),
  play: jest.fn(),
  pause: jest.fn(),
  seekTo: jest.fn(),
};

jest.mock('expo-audio', () => ({
  useAudioPlayer: () => mockPlayer,
  useAudioPlayerStatus: () => ({
    duration: 30,
    currentTime: 0,
    playbackRate: 1,
    playing: false,
  }),
}));

describe('AudioCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPlayer.playbackRate = 1;
  });

  it('changes speed while paused and uses the selected speed when playback starts', async () => {
    const { getByLabelText } = await render(<AudioCard uri="file:///audio.m4a" showPlaybackRate />);

    await fireEvent.press(getByLabelText('Playback speed 1x'));
    expect(mockPlayer.setPlaybackRate).toHaveBeenLastCalledWith(1.25);
    expect(getByLabelText('Playback speed 1.25x')).toBeTruthy();

    await fireEvent.press(getByLabelText('Play audio'));
    expect(mockPlayer.setPlaybackRate).toHaveBeenLastCalledWith(1.25);
    expect(mockPlayer.play).toHaveBeenCalledTimes(1);
  });

  it('places pinned playback controls below the waveform and centered', async () => {
    const { getByTestId, getByLabelText } = await render(
      <AudioCard uri="file:///audio.m4a" compactWaveform stackedControls />
    );

    expect(getByTestId('audio-stacked-controls').props.className).toContain('items-center');
    expect(getByTestId('audio-playback-button-wrapper').props.className).toContain('items-center');
    expect(getByLabelText('Play audio')).toBeTruthy();
    expect(getByTestId('audio-waveform')).toBeTruthy();
  });
});
