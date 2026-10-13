import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { PauseIcon, PlayIcon } from 'phosphor-react-native';
import { memo, useMemo, useState } from 'react';
import { Pressable, Text, View, type LayoutChangeEvent } from 'react-native';

import { Button } from '@/components/Button';
import { buildAudioWaveform } from '@/lib/library/audioWaveform';

function timeLabel(milliseconds: number) {
  const seconds = Math.floor(Math.max(0, milliseconds) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

const PLAYBACK_RATES = [1, 1.25, 1.5, 1.75, 2, 0.5] as const;

export const AudioCard = memo(function AudioCard({
  uri,
  title,
  waveform,
  showPlaybackRate = false,
  compactWaveform = false,
}: {
  uri: string;
  title?: string;
  waveform?: number[];
  showPlaybackRate?: boolean;
  compactWaveform?: boolean;
}) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  const duration = status.duration || 0;
  const current = status.currentTime || 0;
  const [playbackRate, setPlaybackRate] = useState(player.playbackRate || 1);
  const [waveformWidth, setWaveformWidth] = useState(0);
  const displayWaveform = useMemo(
    () => (waveform && compactWaveform ? buildAudioWaveform(waveform, 24) : waveform),
    [waveform, compactWaveform]
  );
  const rateLabel = `${playbackRate}x`;
  const progress = duration > 0 ? Math.min(1, current / duration) : 0;
  const playedBars = displayWaveform ? Math.floor(progress * displayWaveform.length) : 0;

  const changePlaybackRate = () => {
    const currentIndex = PLAYBACK_RATES.findIndex((rate) => rate === playbackRate);
    const nextRate = PLAYBACK_RATES[(currentIndex + 1) % PLAYBACK_RATES.length];
    setPlaybackRate(nextRate);
    player.setPlaybackRate(nextRate);
  };

  const togglePlayback = () => {
    if (status.playing) {
      player.pause();
      return;
    }

    player.setPlaybackRate(playbackRate);
    if (current >= duration && duration > 0) player.seekTo(0);
    player.play();
  };

  return (
    <View className="w-full">
      <View className="rounded-xl bg-zinc-900 p-4">
        <View className={`flex-row items-center ${compactWaveform ? 'gap-3' : 'gap-5'}`}>
          <View className="h-12 w-12 shrink-0 items-center justify-center">
            <Button
              size="small"
              variant={status.playing ? 'primary' : 'secondary'}
              accessibilityLabel={status.playing ? 'Pause audio' : 'Play audio'}
              onPress={togglePlayback}
              icon={
                status.playing ? (
                  <PauseIcon size={16} color="#000" weight="fill" />
                ) : (
                  <PlayIcon size={16} color="#fff" weight="fill" />
                )
              }
            />
          </View>
          <View className="flex-1 gap-1.5">
            <View className="flex-row items-center gap-5">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Seek audio"
                onLayout={(event: LayoutChangeEvent) =>
                  setWaveformWidth(event.nativeEvent.layout.width)
                }
                onPress={(event) => {
                  if (duration <= 0 || waveformWidth <= 0) return;
                  const ratio = Math.max(
                    0,
                    Math.min(1, event.nativeEvent.locationX / waveformWidth)
                  );
                  void player.seekTo(ratio * duration);
                }}
                className={`h-8 flex-1 flex-row items-center ${displayWaveform ? 'gap-[2px]' : ''}`}
              >
                {displayWaveform?.length ? (
                  displayWaveform.map((amplitude, index) => (
                    <View
                      key={index}
                      pointerEvents="none"
                      style={{
                        flex: 1,
                        height: Math.max(3, (amplitude / 100) * 26),
                        borderRadius: 2,
                        backgroundColor: index < playedBars ? '#FFFFFF' : '#52525B',
                      }}
                    />
                  ))
                ) : (
                  <View
                    pointerEvents="none"
                    className="h-1 w-full overflow-hidden rounded-full bg-zinc-700"
                  >
                    <View className="h-full bg-white" style={{ width: `${progress * 100}%` }} />
                  </View>
                )}
              </Pressable>
            </View>

            <Text className={`font-sans ${compactWaveform ? 'text-xs' : 'text-sm'} text-zinc-300`}>
              {timeLabel(current * 1000)} / {timeLabel(duration * 1000)}
            </Text>
          </View>

          {showPlaybackRate && (
            <Pressable
              onPress={changePlaybackRate}
              accessibilityRole="button"
              accessibilityLabel={`Playback speed ${rateLabel}`}
              className="min-w-16 items-center rounded-full bg-zinc-950/80 px-2 py-1 active:opacity-70"
            >
              <Text className="font-sans-semibold text-lg text-zinc-200">{rateLabel}</Text>
            </Pressable>
          )}
        </View>
      </View>
      {title && (
        <Text
          className="font-sans-medium text-center text-xs text-zinc-400 leading-[1.6] mt-2"
          numberOfLines={2}
        >
          {title}
        </Text>
      )}
    </View>
  );
});
