import { BookIcon, FilmSlateIcon, GameControllerIcon, MusicNoteIcon } from 'phosphor-react-native';
import { JSX, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { NewBookModal } from '@/components/modals/NewBookModal';
import { NewGameModal } from '@/components/modals/NewGameModal';
import { NewMovieModal } from '@/components/modals/NewMovieModal';
import { NewMusicModal } from '@/components/modals/NewMusicModal';

type EntertainmentType = 'book' | 'music' | 'movie' | 'game';

type Props = {
  visible: boolean;
  onClose: () => void;
  onDismiss?: () => void;
};

const tabs: { id: EntertainmentType; label: string; icon: JSX.Element }[] = [
  { id: 'book', label: 'Book', icon: <BookIcon size={20} color="#FFFFFF" weight="bold" /> },
  { id: 'music', label: 'Music', icon: <MusicNoteIcon size={20} color="#FFFFFF" weight="bold" /> },
  { id: 'movie', label: 'Film', icon: <FilmSlateIcon size={20} color="#FFFFFF" weight="bold" /> },
  {
    id: 'game',
    label: 'Game',
    icon: <GameControllerIcon size={20} color="#FFFFFF" weight="bold" />,
  },
];

export function EntertainmentTabs({
  selectedType,
  onSelect,
}: {
  selectedType: EntertainmentType;
  onSelect: (type: EntertainmentType) => void;
}) {
  return (
    <View className="flex-1 flex-row rounded-xl justify-between px-8">
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          accessibilityLabel={tab.label}
          accessibilityRole="tab"
          selected={selectedType === tab.id}
          onPress={() => onSelect(tab.id)}
          size="small"
          variant={selectedType === tab.id ? 'primary' : 'secondary'}
          backgroundColor="#FFFFFF"
          contentColor={selectedType === tab.id ? '#000000' : '#FFFFFF'}
          text={tab.label}
          icon={tab.icon}
        />
      ))}
    </View>
  );
}

export function NewEntertainmentModal({ visible, onClose, onDismiss }: Props) {
  const [selectedType, setSelectedType] = useState<EntertainmentType>('book');
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      onDismiss={onDismiss}
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <View className="flex-1">
        <View pointerEvents="none" className="bg-zinc-950" style={StyleSheet.absoluteFill} />
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View className="flex-1" style={{ paddingTop: Math.max(insets.top, 16) }}>
            <View className="flex-row items-center pt-4">
              <EntertainmentTabs selectedType={selectedType} onSelect={setSelectedType} />
            </View>

            <View className="flex-1">
              <NewBookModal
                visible={visible && selectedType === 'book'}
                embedded
                onClose={onClose}
              />
              <NewMusicModal
                visible={visible && selectedType === 'music'}
                embedded
                onClose={onClose}
              />
              <NewMovieModal
                visible={visible && selectedType === 'movie'}
                embedded
                onClose={onClose}
              />
              <NewGameModal
                visible={visible && selectedType === 'game'}
                embedded
                onClose={onClose}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
