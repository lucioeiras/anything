import { decodeHTML } from 'entities';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { BookCover } from '../effects/BookCover';

type BookCardProps = {
  title: string;
  authors?: string[];
  cover?: string;
  coverAspectRatio?: number;
  publisher?: string;
  publishedDate?: string;
  pageCount?: number;
};

export const BookCard = ({
  title,
  authors,
  cover,
  coverAspectRatio,
  publisher,
  publishedDate,
  pageCount,
}: BookCardProps) => {
  const [aspectRatio, setAspectRatio] = useState<number>(coverAspectRatio ?? 2 / 3);

  const cleanTitle = title ? decodeHTML(title) : 'Untitled Book';
  const authorNames =
    authors && authors.length > 0 ? authors.map((a) => decodeHTML(a)).join(', ') : undefined;

  // Extract year from publishedDate (e.g., '2008-08-01' -> '2008')
  const publishedYear = publishedDate ? publishedDate.split('-')[0] : undefined;

  const metaParts: string[] = [];
  if (publishedYear) metaParts.push(publishedYear);
  if (pageCount) metaParts.push(`${pageCount} pgs`);
  if (!publishedYear && !pageCount && publisher) metaParts.push(decodeHTML(publisher));

  return (
    <View className="w-full overflow-hidden">
      <BookCover
        cover={cover}
        title={cleanTitle}
        aspectRatio={aspectRatio}
        onAspectRatioChange={setAspectRatio}
      />

      <View className="w-full gap-2 my-4 items-center">
        <Text className="font-sans-medium text-base leading-[1.4] text-zinc-50" numberOfLines={3}>
          {cleanTitle}
        </Text>

        {authorNames && (
          <Text className="font-sans text-xs text-zinc-400 leading-[1.4]" numberOfLines={2}>
            {authorNames}
          </Text>
        )}
      </View>
    </View>
  );
};
