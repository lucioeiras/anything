import { router } from 'expo-router';
import { ArrowsDownUpIcon, FolderOpenIcon } from 'phosphor-react-native';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLibrary } from '@/hooks/useLibrary';

export default function SettingsScreen() {
  const { currentFolderName } = useLibrary();

  const changeFolder = () => {
    router.replace('/');
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950 items-center justify-center p-6" edges={['top']}>
      <View className="h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 mb-8">
        <FolderOpenIcon size={32} color="#3b82f6" weight="duotone" />
      </View>

      <Text className="font-sans-medium text-3xl text-white text-center w-full">
        You are in the{' '}
        <Text className="font-serif-italic text-3xl text-blue-500 text-center">
          {' '}
          {currentFolderName}
        </Text>{' '}
        space
      </Text>
      <Text className="font-sans text-base text-zinc-400 mt-3 text-center max-w-80">
        You can change spaces by selecting another folder at any time.
      </Text>

      <Pressable
        onPress={changeFolder}
        className="w-full max-w-80 py-3 flex-row items-center justify-center gap-2 bg-white rounded-full mt-8"
      >
        <ArrowsDownUpIcon size={20} color="#000" />
        <Text className="font-sans-semibold text-lg text-zinc-950">Change space</Text>
      </Pressable>
    </SafeAreaView>
  );
}
