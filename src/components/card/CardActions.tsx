import {
  ArrowSquareOutIcon,
  CopyIcon,
  DownloadSimpleIcon,
  ExportIcon,
  FilePdfIcon,
  FolderPlusIcon,
  MicrophoneIcon,
  NotePencilIcon,
  TrashSimpleIcon,
} from 'phosphor-react-native';

import { ActionFooter } from '@/components/ActionFooter';
import { Button } from '@/components/Button';

import type { LibraryItem } from '@/lib/library/types';

type CardActionsProps = {
  item: LibraryItem;
  bottomInset?: number;
  onDelete: () => void;
  onAddToFolder: () => void;
  onDownload: () => void;
  onCopy: () => void;
  onShare: () => void;
  onOpenLink: () => void;
  onOpenPdf: () => void;
  onEditNote: () => void;
  onTranscribeAudio?: () => void;
  isTranscribingAudio?: boolean;
  showTranscribeAudio?: boolean;
};

export function CardActions({
  item,
  bottomInset = 0,
  onDelete,
  onAddToFolder,
  onDownload,
  onCopy,
  onShare,
  onOpenLink,
  onOpenPdf,
  onEditNote,
  onTranscribeAudio,
  isTranscribingAudio = false,
  showTranscribeAudio,
}: CardActionsProps) {
  const isLink = ['link', 'article', 'youtube', 'tiktok', 'tweet', 'reddit'].includes(item.type);
  const isImage = item.type === 'image';
  const isPdf = item.type === 'pdf';
  const isMusic = item.type === 'music';
  const isGame = item.type === 'game';
  const isNoteOrQuote = item.type === 'note' || item.type === 'quote';
  const actions = [
    {
      accessibilityLabel: 'Delete',
      icon: <TrashSimpleIcon size={24} color="#EF4444" />,
      onPress: onDelete,
    },
    {
      accessibilityLabel: 'Add to folder',
      icon: <FolderPlusIcon size={24} color="#FFFFFF" />,
      onPress: onAddToFolder,
    },
    ...(isImage
      ? [
          {
            accessibilityLabel: 'Download image',
            icon: <DownloadSimpleIcon size={24} color="#FFFFFF" />,
            onPress: onDownload,
          },
        ]
      : []),
    ...((showTranscribeAudio ?? (item.type === 'audio' && !item.transcript?.trim())) &&
    item.type === 'audio' &&
    onTranscribeAudio &&
    !isTranscribingAudio
      ? [
          {
            accessibilityLabel: 'Transcribe audio',
            icon: <MicrophoneIcon size={24} color="#FFFFFF" />,
            onPress: onTranscribeAudio,
          },
        ]
      : []),
    ...(isImage ||
    isNoteOrQuote ||
    isPdf ||
    isMusic ||
    isGame ||
    item.type === 'movie' ||
    item.type === 'book'
      ? [
          {
            accessibilityLabel: 'Copy',
            icon: <CopyIcon size={24} color="#FFFFFF" />,
            onPress: onCopy,
          },
        ]
      : []),
    ...(item.type === 'note'
      ? [
          {
            accessibilityLabel: 'Edit note',
            icon: <NotePencilIcon size={24} color="#FFFFFF" />,
            onPress: onEditNote,
          },
        ]
      : []),
    ...(isLink ||
    isImage ||
    isPdf ||
    isMusic ||
    isGame ||
    item.type === 'movie' ||
    item.type === 'book'
      ? [
          {
            accessibilityLabel: 'Share',
            icon: <ExportIcon size={24} color="#FFFFFF" />,
            onPress: onShare,
          },
        ]
      : []),
    ...(isLink ||
    (item.type === 'book' && Boolean(item.url)) ||
    (isMusic && Boolean(item.externalUrl)) ||
    (isGame && Boolean(item.website)) ||
    (item.type === 'movie' && Boolean(item.tmdbId))
      ? [
          {
            accessibilityLabel: 'Open link',
            icon: <ArrowSquareOutIcon size={24} color="#FFFFFF" />,
            onPress: onOpenLink,
          },
        ]
      : []),
    ...(isPdf
      ? [
          {
            accessibilityLabel: 'Open PDF',
            icon: <FilePdfIcon size={24} color="#FFFFFF" weight="duotone" />,
            onPress: onOpenPdf,
          },
        ]
      : []),
  ];

  return (
    <ActionFooter bottomInset={bottomInset} overlay>
      {actions.map((action) => (
        <Button key={action.accessibilityLabel} {...action} />
      ))}
    </ActionFooter>
  );
}
