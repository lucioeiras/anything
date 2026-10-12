import {
  BookmarkSimpleIcon,
  CheckCircleIcon,
  ClockIcon,
  ProhibitIcon,
} from 'phosphor-react-native';
import { Text, View } from 'react-native';

import type { LibraryItem, MediaProgressStatus } from '@/lib/library/types';

type TrackableItemType = Extract<LibraryItem, { progressStatus?: MediaProgressStatus }>['type'];

const labels = {
  book: {
    want: 'Want to read',
    'in-progress': 'Reading',
    completed: 'Read',
    abandoned: 'Abandoned',
  },
  movie: {
    want: 'Want to watch',
    'in-progress': 'Watching',
    completed: 'Watched',
    abandoned: 'Abandoned',
  },
  game: {
    want: 'Want to play',
    'in-progress': 'Playing',
    completed: 'Played',
    abandoned: 'Abandoned',
  },
  article: {
    want: 'Want to read',
    'in-progress': 'Reading',
    completed: 'Read',
    abandoned: 'Abandoned',
  },
  youtube: {
    want: 'Want to watch',
    'in-progress': 'Watching',
    completed: 'Watched',
    abandoned: 'Abandoned',
  },
} as const;

const icons = {
  want: BookmarkSimpleIcon,
  'in-progress': ClockIcon,
  completed: CheckCircleIcon,
  abandoned: ProhibitIcon,
} as const;

const colors = {
  want: '#93C5FD',
  'in-progress': '#FCD34D',
  completed: '#6EE7B7',
  abandoned: '#A1A1AA',
} as const;

export function getProgressLabel(type: TrackableItemType, status: MediaProgressStatus): string {
  return labels[type][status];
}

export function ProgressStatus({
  type,
  status = 'want',
  align = 'center',
}: {
  type: TrackableItemType;
  status?: MediaProgressStatus;
  align?: 'center' | 'start';
}) {
  const currentStatus =
    (type === 'article' || type === 'youtube') && status === 'abandoned' ? 'want' : status;
  const Icon = icons[currentStatus];
  const color = colors[currentStatus];

  return (
    <View className={`flex-row items-center gap-1.5 ${align === 'center' ? 'justify-center' : ''}`}>
      <Icon size={13} color={color} weight="bold" />
      <Text className="font-sans-medium text-xs text-center" style={{ color }} numberOfLines={1}>
        {getProgressLabel(type, currentStatus)}
      </Text>
    </View>
  );
}
