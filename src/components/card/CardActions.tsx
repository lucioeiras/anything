import {
  ArrowSquareOutIcon,
  CopyIcon,
  DownloadSimpleIcon,
  ExportIcon,
  FilePdfIcon,
  TrashSimpleIcon,
} from 'phosphor-react-native';
import { Pressable, View } from 'react-native';

import type { LibraryItem } from '@/lib/library/types';

type CardActionsProps = {
  item: LibraryItem;
  onDelete: () => void;
  onDownload: () => void;
  onCopy: () => void;
  onShare: () => void;
  onOpenLink: () => void;
  onOpenPdf: () => void;
};

export function CardActions({
  item,
  onDelete: handleDelete,
  onDownload: handleDownload,
  onCopy: handleCopy,
  onShare: handleShare,
  onOpenLink: handleOpenLink,
  onOpenPdf: handleOpenPdf,
}: CardActionsProps) {
  const isLink = ['link', 'article', 'youtube', 'tweet', 'reddit'].includes(item.type);
  const isImage = item.type === 'image';
  const isPdf = item.type === 'pdf';
  const isMusic = item.type === 'music';
  const isGame = item.type === 'game';
  const isNoteOrQuote = item.type === 'note' || item.type === 'quote';
  return (
    <View pointerEvents="box-none">
      <View className="w-full flex-row items-center justify-center border-t border-zinc-800 bg-zinc-950">
        {/* Delete button */}
        <Pressable
          onPress={handleDelete}
          hitSlop={12}
          className="flex-1 pt-6 pb-10 items-center justify-center border-r border-zinc-800 active:bg-zinc-900"
          accessibilityRole="button"
          accessibilityLabel="Delete"
        >
          <TrashSimpleIcon size={24} color="#EF4444" />
        </Pressable>

        {/* Download button (images only) */}
        {isImage && (
          <Pressable
            onPress={handleDownload}
            hitSlop={12}
            className="flex-1 pt-6 pb-10 items-center justify-center border-r border-zinc-800 active:bg-zinc-900"
            accessibilityRole="button"
            accessibilityLabel="Download image"
          >
            <DownloadSimpleIcon size={24} color="#FFFFFF" />
          </Pressable>
        )}

        {/* Copy button (images, notes, quotes, pdfs, movies, books, music, and games) */}
        {(isImage ||
          isNoteOrQuote ||
          isPdf ||
          isMusic ||
          isGame ||
          item.type === 'movie' ||
          item.type === 'book') && (
          <Pressable
            onPress={handleCopy}
            hitSlop={12}
            className={`flex-1 pt-6 pb-10 items-center justify-center active:bg-zinc-900 ${
              isImage || isPdf || isMusic || (isGame && Boolean(item.website))
                ? 'border-r border-zinc-800'
                : ''
            }`}
            accessibilityRole="button"
            accessibilityLabel="Copy"
          >
            <CopyIcon size={24} color="#FFFFFF" />
          </Pressable>
        )}

        {/* Share button (links, images, pdfs, movies, books, music, and games) */}
        {(isLink ||
          isImage ||
          isPdf ||
          isMusic ||
          isGame ||
          item.type === 'movie' ||
          item.type === 'book') && (
          <Pressable
            onPress={handleShare}
            hitSlop={12}
            className={`flex-1 pt-6 pb-10 items-center justify-center active:bg-zinc-900 ${
              isLink ||
              isPdf ||
              (item.type === 'book' && Boolean(item.url)) ||
              (isMusic && Boolean(item.externalUrl)) ||
              (isGame && Boolean(item.website)) ||
              (item.type === 'movie' && Boolean(item.tmdbId))
                ? 'border-r border-zinc-800'
                : ''
            }`}
            accessibilityRole="button"
            accessibilityLabel="Share"
          >
            <ExportIcon size={24} color="#FFFFFF" />
          </Pressable>
        )}

        {/* Open link button (links, books with url, music with externalUrl, games with website, or movies with tmdbId) */}
        {(isLink ||
          (item.type === 'book' && Boolean(item.url)) ||
          (isMusic && Boolean(item.externalUrl)) ||
          (isGame && Boolean(item.website)) ||
          (item.type === 'movie' && Boolean(item.tmdbId))) && (
          <Pressable
            onPress={handleOpenLink}
            hitSlop={12}
            className="flex-1 pt-6 pb-10 items-center justify-center active:bg-zinc-900"
            accessibilityRole="button"
            accessibilityLabel="Open link"
          >
            <ArrowSquareOutIcon size={24} color="#FFFFFF" />
          </Pressable>
        )}

        {/* Open PDF button (PDFs only) */}
        {isPdf && (
          <Pressable
            onPress={handleOpenPdf}
            hitSlop={12}
            className="flex-1 pt-6 pb-10 items-center justify-center active:bg-zinc-900"
            accessibilityRole="button"
            accessibilityLabel="Open PDF"
          >
            <FilePdfIcon size={24} color="#FFFFFF" weight="duotone" />
          </Pressable>
        )}
      </View>
    </View>
  );
}
