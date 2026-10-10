import { decodeHTML } from 'entities';
import { BookOpenIcon } from 'phosphor-react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { BookCover } from './BookCover';

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

  const metaText = metaParts.join(' · ');

  return (
    <View className="w-full overflow-hidden">
      <BookCover
        cover={cover}
        title={cleanTitle}
        aspectRatio={aspectRatio}
        onAspectRatioChange={setAspectRatio}
      />

      <View className="w-full p-6 gap-2 bg-amber-950/15">
        <Text className="font-sans-medium text-base leading-[1.4] text-zinc-50" numberOfLines={3}>
          {cleanTitle}
        </Text>

        {authorNames && (
          <Text className="font-sans text-xs text-amber-400/90 leading-[1.4]" numberOfLines={2}>
            {authorNames}
          </Text>
        )}

        <View className="flex-row items-center gap-1.5 mt-2">
          <BookOpenIcon size={13} color="#F59E0B" weight="bold" />
          <Text className="font-sans-semibold text-xs text-amber-500/80" numberOfLines={1}>
            {metaText || 'Book'}
          </Text>
        </View>
      </View>
    </View>
  );
};
