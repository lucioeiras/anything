import { decodeHTML } from 'entities';
import { Text, View } from 'react-native';

import QuoteClose from '../../assets/quote-close.svg';
import QuoteOpen from '../../assets/quote-open.svg';

type QuoteProps = {
  text: string;
  title?: string;
};

export const QuoteCard = ({ text, title }: QuoteProps) => {
  const cleanText = text ? decodeHTML(text) : '';
  const cleanTitle = title ? decodeHTML(title) : undefined;

  return (
    <View className="w-full items-center">
      <View className="w-full p-6 items-center gap-5 bg-zinc-900/80 rounded-xl">
        <QuoteOpen />
        <Text
          className="font-sans-medium text-lg text-center leading-[1.8] text-zinc-100"
          numberOfLines={8}
        >
          {cleanText}
        </Text>
        <QuoteClose />
      </View>

      {cleanTitle && (
        <Text
          className="font-sans-medium text-xs text-zinc-400 text-center mt-3 leading-[1.6]"
          numberOfLines={2}
        >
          {cleanTitle}
        </Text>
      )}
    </View>
  );
};
