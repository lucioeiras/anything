import { Text, View } from 'react-native';

import QuoteClose from '../../assets/quote-close.svg';
import QuoteOpen from '../../assets/quote-open.svg';

type QuoteProps = {
  text: string;
  title?: string;
};

export const QuoteCard = ({ text, title }: QuoteProps) => {
  return (
    <View className="items-center gap-2">
      <View className="w-full bg-zinc-900 p-6 rounded-xl items-center gap-3">
        <QuoteOpen />
        <Text
          className="font-sans text-base text-center leading-[1.8] text-zinc-300"
          numberOfLines={8}>
          {text}
        </Text>
        <QuoteClose />
      </View>

      {title && (
        <Text className="font-sans-medium text-xs text-zinc-200 mb-2" numberOfLines={1}>
          {title}
        </Text>
      )}
    </View>
  );
};
