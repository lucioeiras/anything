import { CheckIcon } from 'phosphor-react-native';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import type { LibraryItem } from '@/lib/library/types';

import { ArticleCard } from './ArticleCard';
import { ImageCard } from './ImageCard';
import { LinkCard } from './LinkCard';
import { NoteCard } from './NoteCard';
import { QuoteCard } from './QuoteCard';
import { RedditCard } from './RedditCard';
import { TweetCard } from './TweetCard';
import { YouTubeCard } from './YouTubeCard';

type ItemCardProps = {
  item: LibraryItem;
  isEditing?: boolean;
  isSelected?: boolean;
  onPress?: (item: LibraryItem) => void;
  onLongPress?: (item: LibraryItem) => void;
};

/** Maps a library item (from JSON) to the matching card component with edition mode support. */
export const ItemCard = memo(function ItemCard({
  item,
  isEditing = false,
  isSelected = false,
  onPress,
  onLongPress,
}: ItemCardProps) {
  const renderCardContent = () => {
    switch (item.type) {
      case 'note':
        return <NoteCard text={item.text} title={item.title} />;
      case 'quote':
        return <QuoteCard text={item.text} title={item.title} />;
      case 'image':
        return <ImageCard url={item.image} title={item.title} note={item.note} />;
      case 'link':
        return (
          <LinkCard
            favicon={item.favicon}
            siteTitle={item.siteTitle}
            description={item.description}
            url={item.url}
          />
        );
      case 'article':
        return (
          <ArticleCard articleTitle={item.title} thumbnail={item.thumbnail} origin={item.origin} />
        );
      case 'youtube':
        return <YouTubeCard videoTitle={item.title} thumbnail={item.thumbnail} />;
      case 'tweet':
        return (
          <TweetCard
            avatar={item.avatar}
            author={item.author}
            text={item.text}
            images={item.images}
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
    }
  };

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
        <View className="w-full rounded-2xl overflow-hidden">{renderCardContent()}</View>

        {isSelected && (
          <View
            pointerEvents="none"
            className="absolute inset-0 rounded-2xl border-[3px] border-blue-500 z-10"
          />
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
    </Pressable>
  );
});
