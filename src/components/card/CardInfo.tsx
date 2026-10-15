import { formatDuration } from '@/lib/music/itunes';
import { decodeHTML } from 'entities';
import {
  BarcodeIcon,
  BookOpenIcon,
  CalendarBlankIcon,
  CalendarCheckIcon,
  CheckSquareIcon,
  ClockIcon,
  DiscIcon,
  FilePdfIcon,
  FilmSlateIcon,
  GameControllerIcon,
  InfoIcon,
  JoystickIcon,
  MusicNotesIcon,
  StarIcon,
  UserIcon,
  UsersThreeIcon,
} from 'phosphor-react-native';
import { Text, View } from 'react-native';

import { cleanRawgDescription } from '@/lib/games/rawg';
import type { LibraryItem } from '@/lib/library/types';
import { LocalizedText } from '@/components/LocalizedText';
import { translate, useLocalization } from '@/lib/i18n';

function formatDateAdded(isoDate: string, locale: string): string {
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let size = bytes / 1024;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

export function CardInfo({ item }: { item: LibraryItem }) {
  const { language } = useLocalization();
  const locale = language === 'pt' ? 'pt-BR' : 'en-US';
  const gameInfo =
    item.type === 'game'
      ? {
          description: cleanRawgDescription(item.description || ''),
          released: item.released,
          platforms: item.platforms,
          genres: item.genres,
          rating: item.rating,
          metacritic: item.metacritic,
          developers: item.developers,
          publishers: item.publishers,
        }
      : null;

  return (
    <View className="py-6 px-6 gap-4">
      <View className="flex-row items-center gap-2">
        <InfoIcon size={14} color="#E4E4E7" weight="bold" />
        <Text className="font-sans-semibold text-sm tracking-wider uppercase text-zinc-200">
          <LocalizedText>Info</LocalizedText>
        </Text>
      </View>

      <View className="flex-row items-center gap-2.5">
        <CalendarBlankIcon size={16} color="#A1A1AA" />
        <Text className="font-sans text-base text-zinc-400">
          {translate('Added %{date}', { date: formatDateAdded(item.createdAt, locale) })}
        </Text>
      </View>

      {item.type === 'pdf' && item.originalFileName && (
        <View className="flex-row items-center gap-2.5">
          <FilePdfIcon size={16} color="#A1A1AA" />
          <Text className="flex-1 font-sans text-base text-zinc-400" numberOfLines={2}>
            {item.originalFileName}
          </Text>
        </View>
      )}
      {item.type === 'pdf' && typeof item.fileSize === 'number' && item.fileSize > 0 && (
        <View className="flex-row items-center gap-2.5">
          <InfoIcon size={16} color="#A1A1AA" />
          <Text className="font-sans text-base text-zinc-400">{formatFileSize(item.fileSize)}</Text>
        </View>
      )}

      {item.type === 'movie' && (
        <>
          {Boolean(item.releaseDate) && (
            <View className="flex-row items-center gap-2.5">
              <CalendarCheckIcon size={16} color="#A1A1AA" />
              <Text className="font-sans text-base text-zinc-400">
                <LocalizedText>Released </LocalizedText>
                {item.releaseDate}
              </Text>
            </View>
          )}
          {Boolean(item.director) && (
            <View className="flex-row items-center gap-2.5">
              <UserIcon size={16} color="#A1A1AA" />
              <Text className="font-sans text-base text-zinc-400">
                {decodeHTML(item.director || '')}
              </Text>
            </View>
          )}
          {Boolean(item.runtime) && (
            <View className="flex-row items-center gap-2.5">
              <ClockIcon size={16} color="#A1A1AA" />
              <Text className="font-sans text-base text-zinc-400">
                {item.runtime} <LocalizedText>min</LocalizedText>
              </Text>
            </View>
          )}
          {typeof item.voteAverage === 'number' && item.voteAverage > 0 && (
            <View className="flex-row items-center gap-2.5">
              <StarIcon size={16} color="#A1A1AA" />
              <Text className="font-sans text-base text-zinc-400">
                {item.voteAverage.toFixed(1)} <LocalizedText>/ 10</LocalizedText>
              </Text>
            </View>
          )}
          {Boolean(item.genres && item.genres.length > 0) && (
            <View className="flex-row items-center gap-2.5">
              <FilmSlateIcon size={16} color="#A1A1AA" />
              <Text className="font-sans text-base text-zinc-400">
                {item.genres?.map(decodeHTML).join(', ')}
              </Text>
            </View>
          )}
        </>
      )}

      {item.type === 'tvshow' && (
        <>
          {Boolean(item.firstAirDate) && (
            <View className="flex-row items-center gap-2.5">
              <CalendarCheckIcon size={16} color="#A1A1AA" />
              <Text className="font-sans text-base text-zinc-400">
                <LocalizedText>First aired </LocalizedText>
                {item.firstAirDate}
              </Text>
            </View>
          )}
          {typeof item.voteAverage === 'number' && item.voteAverage > 0 && (
            <View className="flex-row items-center gap-2.5">
              <StarIcon size={16} color="#A1A1AA" />
              <Text className="font-sans text-base text-zinc-400">
                {item.voteAverage.toFixed(1)} <LocalizedText>/ 10</LocalizedText>
              </Text>
            </View>
          )}
          {!!item.genres?.length && (
            <View className="flex-row items-center gap-2.5">
              <FilmSlateIcon size={16} color="#A1A1AA" />
              <Text className="font-sans text-base text-zinc-400">{item.genres.join(', ')}</Text>
            </View>
          )}
        </>
      )}

      {item.type === 'music' && (
        <>
          {item.musicKind === 'album' && (
            <View className="flex-row items-center gap-2.5">
              <DiscIcon size={16} color="#A1A1AA" />
              <Text className="font-sans text-base text-zinc-400">
                <LocalizedText>Album</LocalizedText>
              </Text>
            </View>
          )}
          {item.album && (
            <View className="flex-row items-center gap-2.5">
              <DiscIcon size={16} color="#A1A1AA" />
              <Text className="font-sans text-base text-zinc-400">{decodeHTML(item.album)}</Text>
            </View>
          )}
          {item.genre && (
            <View className="flex-row items-center gap-2.5">
              <MusicNotesIcon size={16} color="#A1A1AA" />
              <Text className="font-sans text-base text-zinc-400">{decodeHTML(item.genre)}</Text>
            </View>
          )}
          {Boolean(item.durationMs) && (
            <View className="flex-row items-center gap-2.5">
              <ClockIcon size={16} color="#A1A1AA" />
              <Text className="font-sans text-base text-zinc-400">
                {formatDuration(item.durationMs)}
              </Text>
            </View>
          )}
        </>
      )}

      {item.type === 'game' && (
        <>
          {gameInfo?.released && (
            <View className="flex-row items-center gap-2.5">
              <CalendarCheckIcon size={16} color="#A1A1AA" />
              <Text className="font-sans text-base text-zinc-400">
                <LocalizedText>Released </LocalizedText>
                {formatDateAdded(gameInfo.released, locale)}
              </Text>
            </View>
          )}
          {!!gameInfo?.rating && gameInfo.rating > 0 && (
            <View className="flex-row items-center gap-2.5">
              <StarIcon size={16} color="#A1A1AA" />
              <Text className="font-sans text-base text-zinc-400">
                {gameInfo.rating.toFixed(1)} <LocalizedText>/ 5</LocalizedText>
              </Text>
            </View>
          )}
          {!!gameInfo?.metacritic && gameInfo.metacritic > 0 && (
            <View className="flex-row items-center gap-2.5">
              <StarIcon size={16} color="#A1A1AA" />
              <Text className="font-sans text-base text-zinc-400">
                {gameInfo.metacritic} <LocalizedText>/ 100</LocalizedText>
              </Text>
            </View>
          )}
          {!!gameInfo?.platforms?.length && (
            <View className="flex-row items-center gap-2.5">
              <GameControllerIcon size={16} color="#A1A1AA" />
              <Text className="flex-1 font-sans text-base text-zinc-400">
                {gameInfo.platforms.join(', ')}
              </Text>
            </View>
          )}
          {!!gameInfo?.genres?.length && (
            <View className="flex-row items-center gap-2.5">
              <JoystickIcon size={16} color="#A1A1AA" />
              <Text className="flex-1 font-sans text-base text-zinc-400">
                {gameInfo.genres.map(decodeHTML).join(', ')}
              </Text>
            </View>
          )}
          {!!gameInfo?.developers?.length && (
            <View className="flex-row items-center gap-2.5">
              <UsersThreeIcon size={16} color="#A1A1AA" />
              <Text className="flex-1 font-sans text-base text-zinc-400">
                {gameInfo.developers.map(decodeHTML).join(', ')}
              </Text>
            </View>
          )}
          {!!gameInfo?.publishers?.length && (
            <View className="flex-row items-center gap-2.5">
              <CheckSquareIcon size={16} color="#A1A1AA" />
              <Text className="flex-1 font-sans text-base text-zinc-400">
                {gameInfo.publishers.map(decodeHTML).join(', ')}
              </Text>
            </View>
          )}
        </>
      )}

      {item.type === 'book' && (
        <>
          <View className="flex-row items-center gap-2.5">
            <BarcodeIcon size={16} color="#A1A1AA" />
            <Text className="font-sans text-base text-zinc-400">
              <LocalizedText>ISBN </LocalizedText>
              {item.isbn}
            </Text>
          </View>
          {item.authors && item.authors.length > 0 && (
            <View className="flex-row items-center gap-2.5">
              <UserIcon size={16} color="#A1A1AA" />
              <Text className="font-sans text-base text-zinc-400">{item.authors.join(', ')}</Text>
            </View>
          )}
          {item.publisher && (
            <View className="flex-row items-center gap-2.5">
              <CheckSquareIcon size={16} color="#A1A1AA" />
              <Text className="font-sans text-base text-zinc-400">{item.publisher}</Text>
            </View>
          )}
          {item.pageCount && (
            <View className="flex-row items-center gap-2.5">
              <BookOpenIcon size={16} color="#A1A1AA" />
              <Text className="font-sans text-base text-zinc-400">
                {item.pageCount} <LocalizedText>pages</LocalizedText>
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}
