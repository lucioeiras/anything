import { Image as ExpoImage } from 'expo-image';
import { cssInterop } from 'nativewind';
import { LinkIcon } from 'phosphor-react-native';
import { Text, View } from 'react-native';

cssInterop(ExpoImage, { className: 'style' });

type LinkCardProps = {
  favicon: string;
  siteTitle: string;
  description: string;
  url: string;
};

export const LinkCard = ({ favicon, siteTitle, description, url }: LinkCardProps) => {
  const getShortUrl = (urlStr: string) => {
    try {
      const parsed = new URL(urlStr);

      let hostname = parsed.hostname;

      if (hostname.startsWith('www.')) {
        hostname = hostname.substring(4);
      }

      return hostname;
    } catch {
      return urlStr;
    }
  };

  return (
    <View className="w-full bg-zinc-900 p-4 rounded-xl gap-4">
      <ExpoImage source={{ uri: favicon }} className="w-8 h-8 rounded-full" />

      <View className="gap-2">
        <Text className="font-sans-medium text-lg leading-[1.8] text-zinc-50" numberOfLines={8}>
          {siteTitle}
        </Text>

        <Text className="font-sans text-sm leading-[1.8] text-zinc-300" numberOfLines={8}>
          {description}
        </Text>
      </View>

      <View className="flex-row items-center gap-1 mt-2">
        <LinkIcon size={14} color="#71717B" />
        <Text className="font-sans-semibold text-sm text-zinc-500" numberOfLines={1}>
          {getShortUrl(url)}
        </Text>
      </View>
    </View>
  );
};
