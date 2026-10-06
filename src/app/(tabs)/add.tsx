import { PlusCircleIcon } from 'phosphor-react-native';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddElementScreen() {
  return (
    <SafeAreaView className="flex-1 bg-zinc-950 items-center justify-center p-6" edges={['top']}>
      <View className="h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 mb-4">
        <PlusCircleIcon size={32} color="#3b82f6" weight="duotone" />
      </View>
      <Text className="font-sans-semibold text-lg text-zinc-100">Add Element</Text>
      <Text className="mt-1 text-center font-sans text-sm text-zinc-500 max-w-64">
        Create a new note, link, quote, or upload an image to your board.
      </Text>
    </SafeAreaView>
  );
}
