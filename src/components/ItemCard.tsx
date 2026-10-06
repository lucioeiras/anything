import { memo } from 'react';

import type { LibraryItem } from '@/lib/library/types';

import { ArticleCard } from './ArticleCard';
import { ImageCard } from './ImageCard';
import { LinkCard } from './LinkCard';
import { NoteCard } from './NoteCard';
import { QuoteCard } from './QuoteCard';
import { RedditCard } from './RedditCard';
import { TweetCard } from './TweetCard';
import { YouTubeCard } from './YouTubeCard';

/** Maps a library item (from JSON) to the matching card component. */
export const ItemCard = memo(function ItemCard({ item }: { item: LibraryItem }) {
  switch (item.type) {
    case 'note':
      return <NoteCard text={item.text} title={item.title} />;
    case 'quote':
      return <QuoteCard text={item.text} title={item.title} />;
    case 'image':
      return <ImageCard url={item.image} title={item.title} />;
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
});
