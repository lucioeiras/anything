import { decodeHTML } from 'entities';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { BookCover } from '../effects/BookCover';
import { ProgressStatus } from './ProgressStatus';

import type { MediaProgressStatus } from '@/lib/library/types';

type BookCardProps = {
  title: string;
  hideTitleAndAuthor?: boolean;
  authors?: string[];
  cover?: string;
  coverAspectRatio?: number;
  publisher?: string;
  publishedDate?: string;
  pageCount?: number;
  progressStatus?: MediaProgressStatus;
};

export const BookCard = ({
  title,
  hideTitleAndAuthor = false,
  authors,
  cover,
  coverAspectRatio,
  publisher,
  publishedDate,
  pageCount,
  progressStatus,
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

      {!hideTitleAndAuthor && (
        <View className="w-full gap-1.5 my-3 items-center">
          <Text className="font-sans-medium text-sm leading-[1.4] text-zinc-50" numberOfLines={3}>
            {cleanTitle}
          </Text>

          <ProgressStatus type="book" status={progressStatus} />

          {authorNames && (
            <Text className="font-sans text-xs text-zinc-400 leading-[1.4]" numberOfLines={2}>
              {authorNames}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};
