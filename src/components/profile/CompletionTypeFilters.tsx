import {
  ArticleIcon,
  BookOpenIcon,
  FilmSlateIcon,
  GameControllerIcon,
  YoutubeLogoIcon,
} from 'phosphor-react-native';
import { ScrollView } from 'react-native';
import { TypeFilterButton } from '@/components/menus/TypeFilterButton';
import { CARD_TYPE_LABELS, TRACKABLE_TYPES, type TrackableType } from '@/lib/library/activity';

const ICONS = {
  book: BookOpenIcon,
  movie: FilmSlateIcon,
  tvshow: FilmSlateIcon,
  game: GameControllerIcon,
  article: ArticleIcon,
  youtube: YoutubeLogoIcon,
};

export function CompletionTypeFilters({
  selectedType,
  onSelect,
}: {
  selectedType: TrackableType | null;
  onSelect: (type: TrackableType | null) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="always"
      accessibilityLabel="Filter completed cards by type"
      className="min-w-0 flex-1"
      contentContainerClassName="items-center gap-2 pr-8 py-1"
    >
      {TRACKABLE_TYPES.map((type) => (
        <TypeFilterButton
          key={type}
          label={CARD_TYPE_LABELS[type]}
          icon={ICONS[type]}
          selected={selectedType === type}
          onPress={() => onSelect(selectedType === type ? null : type)}
        />
      ))}
    </ScrollView>
  );
}
