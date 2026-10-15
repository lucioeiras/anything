import { Image as ExpoImage } from 'expo-image';
import {
  ArrowsClockwiseIcon,
  BookmarkSimpleIcon,
  CheckCircleIcon,
  ClockIcon,
  ProhibitIcon,
  TelevisionIcon,
} from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { CardReview } from '@/components/card/CardReview';
import type { MediaProgressStatus, TvShowSeason } from '@/lib/library/types';
import { LocalizedText } from '@/components/LocalizedText';
import { translate, useLocalization } from '@/lib/i18n';

const STATUSES: MediaProgressStatus[] = ['want', 'in-progress', 'completed', 'abandoned'];

const LABELS: Record<MediaProgressStatus, string> = {
  want: 'Want to watch',
  'in-progress': 'Watching',
  completed: 'Watched',
  abandoned: 'Abandoned',
};

const STATUS_TAGS = {
  want: {
    Icon: BookmarkSimpleIcon,
    container: 'bg-blue-500/15',
    text: 'text-blue-300',
    color: '#93C5FD',
  },
  'in-progress': {
    Icon: ClockIcon,
    container: 'bg-amber-400/15',
    text: 'text-amber-200',
    color: '#FCD34D',
  },
  completed: {
    Icon: CheckCircleIcon,
    container: 'bg-emerald-400/15',
    text: 'text-emerald-200',
    color: '#6EE7B7',
  },
  abandoned: {
    Icon: ProhibitIcon,
    container: 'bg-zinc-700/60',
    text: 'text-zinc-300',
    color: '#A1A1AA',
  },
} as const;

export function TvShowSeasons({
  seasons,
  onChange,
}: {
  seasons: TvShowSeason[];
  onChange: (seasons: TvShowSeason[]) => void;
}) {
  useLocalization();
  const [draft, setDraft] = useState(seasons);

  useEffect(() => {
    const timer = setTimeout(() => onChange(draft), 300);
    return () => clearTimeout(timer);
  }, [draft, onChange]);

  const updateSeason = (seasonNumber: number, update: Partial<TvShowSeason>) => {
    setDraft((current) =>
      current.map((season) =>
        season.seasonNumber === seasonNumber ? { ...season, ...update } : season
      )
    );
  };

  return (
    <View className="gap-6 border-b border-zinc-800 px-6 py-6">
      <View className="flex-row items-center gap-2">
        <TelevisionIcon size={15} color="#E4E4E7" weight="bold" />
        <Text className="font-sans-semibold text-sm uppercase tracking-wider text-zinc-200">
          <LocalizedText>Seasons</LocalizedText>
        </Text>
      </View>

      {draft.length > 0 ? (
        draft.map((season, index) => {
          const status = season.progressStatus ?? 'want';
          const nextStatus = STATUSES[(STATUSES.indexOf(status) + 1) % STATUSES.length];
          const statusTag = STATUS_TAGS[status];
          const StatusIcon = statusTag.Icon;
          const metadata = [
            season.episodeCount ? `${season.episodeCount} ${translate('episodes')}` : null,
            season.airDate ? season.airDate.slice(0, 4) : null,
          ].filter(Boolean);

          return (
            <View
              key={`${season.seasonNumber}-${season.tmdbId ?? ''}`}
              className={`gap-3 ${index > 0 ? 'border-t border-zinc-800 pt-4' : ''}`}
            >
              <View className="flex-row gap-3">
                {season.poster ? (
                  <ExpoImage
                    source={{ uri: season.poster }}
                    accessibilityLabel={`${season.name} poster`}
                    contentFit="cover"
                    style={{ width: 42, height: 63, borderRadius: 6, backgroundColor: '#18181b' }}
                  />
                ) : (
                  <View className="h-[63px] w-[42px] rounded-md bg-zinc-900" />
                )}
                <View className="flex-1 justify-center gap-3">
                  <View className="flex-row items-center justify-between gap-3">
                    <View className="flex-1 gap-1">
                      <Text className="font-sans-medium text-base text-zinc-100">
                        {season.name}
                      </Text>
                      {metadata.length > 0 && (
                        <Text className="font-sans text-xs text-zinc-500">
                          {metadata.join(' · ')}
                        </Text>
                      )}
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={translate('Change status: %{status}, %{title}', {
                        status: translate(LABELS[status]),
                        title: season.name,
                      })}
                      onPress={() =>
                        updateSeason(season.seasonNumber, { progressStatus: nextStatus })
                      }
                      className={`flex-row items-center gap-1 rounded-full px-2.5 py-1 active:opacity-70 ${statusTag.container}`}
                      hitSlop={4}
                    >
                      <StatusIcon size={12} color={statusTag.color} weight="bold" />
                      <Text
                        className={`font-sans-medium text-xs ${statusTag.text}`}
                        numberOfLines={1}
                      >
                        {translate(LABELS[status])}
                      </Text>
                      <ArrowsClockwiseIcon size={10} color={statusTag.color} />
                    </Pressable>
                  </View>
                </View>
              </View>
              {status === 'completed' && (
                <CardReview
                  compact
                  rating={season.review?.rating ?? null}
                  comments={season.review?.comments ?? ''}
                  onRatingChange={(rating) =>
                    updateSeason(season.seasonNumber, { review: { ...season.review, rating } })
                  }
                  onCommentsChange={(comments) =>
                    updateSeason(season.seasonNumber, {
                      review: { ...season.review, comments },
                    })
                  }
                />
              )}
            </View>
          );
        })
      ) : (
        <Text className="font-sans text-sm text-zinc-500">
          <LocalizedText>No seasons listed by TMDB.</LocalizedText>
        </Text>
      )}
    </View>
  );
}
