import { Text, View } from 'react-native';
import { decodeHTML } from 'entities';

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
    <View className="w-full p-8 items-center gap-5">
      <QuoteOpen />
      <Text
        className="font-sans-medium text-base text-center leading-[1.8] text-zinc-100"
        numberOfLines={8}
      >
        {cleanText}
      </Text>
      <QuoteClose />

      {cleanTitle && (
        <Text
          className="font-sans-medium text-xs text-zinc-400 text-center mt-2 leading-[1.6]"
          numberOfLines={2}
        >
          {cleanTitle}
        </Text>
      )}
    </View>
  );
};
