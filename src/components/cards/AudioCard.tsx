import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { PauseIcon, PlayIcon } from 'phosphor-react-native';
import { memo } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';

function timeLabel(milliseconds: number) {
  const seconds = Math.floor(Math.max(0, milliseconds) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export const AudioCard = memo(function AudioCard({ uri, title }: { uri: string; title?: string }) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  const duration = status.duration || 0;
  const current = status.currentTime || 0;
  return (
    <View className="w-full">
      <View className="rounded-xl bg-zinc-900 p-4">
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 shrink-0 items-center justify-center">
            <Button
              size="small"
              variant={status.playing ? 'primary' : 'secondary'}
              accessibilityLabel={status.playing ? 'Pause audio' : 'Play audio'}
              onPress={() =>
                status.playing
                  ? player.pause()
                  : (current >= duration && duration > 0 ? player.seekTo(0) : undefined,
                    player.play())
              }
              icon={
                status.playing ? (
                  <PauseIcon size={16} color="#000" weight="fill" />
                ) : (
                  <PlayIcon size={16} color="#fff" weight="fill" />
                )
              }
            />
          </View>
          <View className="flex-1">
            <View className="mt-3 mb-2 h-1 overflow-hidden rounded-full bg-zinc-700">
              <View
                className="h-full bg-white"
                style={{
                  width: `${duration > 0 ? Math.min(100, (current / duration) * 100) : 0}%`,
                }}
              />
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="font-sans text-xs text-zinc-400">
                {timeLabel(current * 1000)} / {timeLabel(duration * 1000)}
              </Text>
            </View>
          </View>
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
