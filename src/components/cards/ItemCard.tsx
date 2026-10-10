import { CheckIcon } from 'phosphor-react-native';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import type { LibraryItem } from '@/lib/library/types';

import { ArticleCard } from './ArticleCard';
import { BookCard } from './BookCard';
import { GameCard } from './GameCard';
import { ImageCard } from './ImageCard';
import { LinkCard } from './LinkCard';
import { MovieCard } from './MovieCard';
import { MusicCard } from './MusicCard';
import { NoteCard } from './NoteCard';
import { PdfCard } from './PdfCard';
import { QuoteCard } from './QuoteCard';
import { RedditCard } from './RedditCard';
import { TweetCard } from './TweetCard';
import { YouTubeCard } from './YouTubeCard';

type ItemCardProps = {
  item: LibraryItem;
  linkedTitle?: string;
  hideTitleAndAuthor?: boolean;
  isEditing?: boolean;
  isSelected?: boolean;
  onPress?: (item: LibraryItem) => void;
  onLongPress?: (item: LibraryItem) => void;
};

/** Maps a library item (from JSON) to the matching card component with edition mode support. */
export const ItemCard = memo(function ItemCard({
  item,
  linkedTitle,
  hideTitleAndAuthor = false,
  isEditing = false,
  isSelected = false,
  onPress,
  onLongPress,
}: ItemCardProps) {
  const isInteractiveTweet =
    item.type === 'tweet' &&
    ((item.images?.length ?? 0) > 1 || Boolean(item.video?.url)) &&
    !isEditing;

  const renderCardContent = () => {
    switch (item.type) {
      case 'note':
        return (
          <NoteCard
            text={item.text}
            title={hideTitleAndAuthor ? undefined : item.title}
            linkedTitle={linkedTitle}
          />
        );
      case 'quote':
        return (
          <QuoteCard
            text={item.text}
            title={hideTitleAndAuthor ? undefined : item.title}
            linkedTitle={linkedTitle}
          />
        );
      case 'image':
        return <ImageCard url={item.image} title={hideTitleAndAuthor ? undefined : item.title} />;
      case 'pdf':
        return (
          <PdfCard url={item.pdf} title={item.title} hideTitleAndAuthor={hideTitleAndAuthor} />
        );
      case 'link':
        return (
          <LinkCard
            favicon={item.favicon}
            siteTitle={item.siteTitle}
            title={item.title}
            description={item.description}
            url={item.url}
          />
        );
      case 'article':
        return (
          <ArticleCard
            articleTitle={item.title}
            thumbnail={item.thumbnail}
            origin={item.origin}
            progressStatus={item.progressStatus}
          />
        );
      case 'youtube':
        return (
          <YouTubeCard
            videoTitle={item.title}
            thumbnail={item.thumbnail}
            progressStatus={item.progressStatus}
          />
        );
      case 'tweet':
        return (
          <TweetCard
            avatar={item.avatar}
            author={item.author}
            text={item.text}
            images={item.images}
            video={item.video}
            onPress={isInteractiveTweet && onPress ? () => onPress(item) : undefined}
            onLongPress={isInteractiveTweet && onLongPress ? () => onLongPress(item) : undefined}
          />
        );
      case 'reddit':
        return (
          <RedditCard
            subredditAvatar={item.subredditAvatar}
            subredditName={item.subreddit}
            postTitle={item.title}
            text={item.text}
            image={item.image}
          />
        );
      case 'book':
        return (
          <BookCard
            title={item.title}
            hideTitleAndAuthor={hideTitleAndAuthor}
            cover={item.cover}
            coverAspectRatio={item.coverAspectRatio}
            publisher={item.publisher}
            publishedDate={item.publishedDate}
            pageCount={item.pageCount}
            progressStatus={item.progressStatus}
          />
        );
      case 'music':
        return (
          <MusicCard
            title={item.title}
            artist={item.artist}
            cover={item.cover}
            hideTitleAndAuthor={hideTitleAndAuthor}
          />
        );
      case 'movie':
        return (
          <MovieCard
            title={item.title}
            hideTitleAndAuthor={hideTitleAndAuthor}
            poster={item.poster}
            releaseYear={item.releaseYear}
            voteAverage={item.voteAverage}
            genres={item.genres}
            runtime={item.runtime}
            progressStatus={item.progressStatus}
          />
        );
      case 'game':
        return (
          <GameCard
            title={item.title}
            cover={item.cover}
            hideTitleAndAuthor={hideTitleAndAuthor}
            progressStatus={item.progressStatus}
          />
        );
    }
  };

  const cardBody = (
    <View
      className="w-full relative"
      style={
        isSelected
          ? {
              shadowColor: '#3b82f6',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: 8,
            }
          : undefined
      }
    >
      <View className="w-full overflow-hidden">{renderCardContent()}</View>

      {isSelected && (
        <View pointerEvents="none" className="absolute inset-0 border-[3px] border-blue-500 z-10" />
      )}

      {isEditing && (
        <View className="absolute top-5 right-5 z-20">
          <View
            className={`w-6 h-6 rounded-full items-center justify-center ${
              isSelected
                ? 'bg-blue-500 border-2 border-blue-500'
                : 'bg-zinc-900 border-2 border-white'
            }`}
          >
            {isSelected && <CheckIcon size={12} color="#ffffff" weight="bold" />}
          </View>
        </View>
      )}
    </View>
  );

  if (isInteractiveTweet) {
    return <View className="w-full">{cardBody}</View>;
  }

  return (
    <Pressable
      onPress={onPress ? () => onPress(item) : undefined}
      onLongPress={onLongPress ? () => onLongPress(item) : undefined}
      delayLongPress={350}
      style={({ pressed }) =>
        pressed ? { opacity: 0.85, transform: [{ scale: 0.98 }] } : undefined
      }
      className="w-full"
    >
      {cardBody}
    </Pressable>
  );
});
