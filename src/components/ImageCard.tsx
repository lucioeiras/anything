import { Image as ExpoImage } from 'expo-image';
import { cssInterop } from 'nativewind';
import { useState } from 'react';
import { Text, View } from 'react-native';

cssInterop(ExpoImage, { className: 'style' });

type NoteProps = {
  url: string;
  title?: string;
  note?: string;
};

export const ImageCard = ({ url, title, note }: NoteProps) => {
  const [aspectRatio, setAspectRatio] = useState(1); // Default to a square until loaded

  return (
    <View className="w-full gap-2">
      <ExpoImage
        source={{ uri: url }}
        className="w-full rounded-xl"
        style={{ aspectRatio }}
        onLoad={(e) => {
          if (e.source.width && e.source.height) {
            const ratio = e.source.width / e.source.height;
            setTimeout(() => setAspectRatio(ratio), 0);
          }
        }}
      />

      {title && (
        <Text
          className="font-sans-medium text-center text-xs text-zinc-200 leading-[1.6]"
          numberOfLines={2}
        >
          {title}
        </Text>
      )}

      {note && (
        <Text
          className="font-sans text-center text-xs text-zinc-400 mb-2 leading-relaxed"
          numberOfLines={3}
        >
          {note}
        </Text>
      )}
    </View>
  );
};
