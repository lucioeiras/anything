import {
  BookIcon,
  ImageSquareIcon,
  LinkIcon,
  NotePencilIcon,
  PlusCircleIcon,
} from 'phosphor-react-native';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddElementScreen() {
  return (
    <SafeAreaView
      className="flex-1 bg-zinc-950 items-center justify-center p-6 pb-40"
      edges={['top']}
    >
      <View className="h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 mb-8">
        <PlusCircleIcon size={32} color="#3b82f6" weight="duotone" />
      </View>

      <Text className="font-sans-medium text-3xl text-white text-center w-full">
        Save <Text className="font-serif-italic text-3xl text-blue-500 text-center"> anything</Text>{' '}
        you want
      </Text>
      <Text className="font-sans text-base text-zinc-400 mt-3 text-center max-w-80">
        You can add notes, to-do's, quotes, links, X posts and Reddit posts, articles, books or
        YouTube vídeos
      </Text>

      <View className="mt-8 gap-5">
        <View className="flex-row flex-wrap justify-center gap-5">
          <Pressable
            // onPress={changeFolder}
            className="p-5 max-w-80 justify-between h-36 w-36 bg-white rounded-xl"
          >
            <NotePencilIcon size={20} color="#000" />
            <Text className="font-sans-semibold text-lg text-zinc-950">Note, quote or to-do</Text>
          </Pressable>

          <Pressable
            // onPress={changeFolder}
            className="p-5 max-w-80 justify-between h-36 w-36 bg-zinc-800 rounded-xl"
          >
            <LinkIcon size={20} color="#fff" />
            <Text className="font-sans-semibold text-lg text-white">Link from anywhere</Text>
          </Pressable>
        </View>

        <View className="flex-row flex-wrap justify-center gap-5">
          <Pressable
            // onPress={changeFolder}
            className="p-5 max-w-80 justify-between h-36 w-36 bg-zinc-800 rounded-xl"
          >
            <BookIcon size={20} color="#fff" />
            <Text className="font-sans-semibold text-lg text-white">Book for the library</Text>
          </Pressable>

          <Pressable
            // onPress={changeFolder}
            className="p-5 max-w-80 justify-between h-36 w-36 bg-zinc-800 rounded-xl"
          >
            <ImageSquareIcon size={20} color="#fff" />
            <Text className="font-sans-semibold text-lg text-white">Image from gallery</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
