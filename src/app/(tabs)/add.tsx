import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import {
  BookIcon,
  ImageSquareIcon,
  LinkIcon,
  NotePencilIcon,
  PlusCircleIcon,
} from 'phosphor-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddElementScreen() {
  const [isPicking, setIsPicking] = useState(false);

  const handlePickImage = async () => {
    if (isPicking) return;

    try {
      setIsPicking(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];

      router.replace({
        pathname: '/board',
        params: {
          newImageUri: asset.uri,
          newImageFileName: asset.fileName ?? '',
          newImageMimeType: asset.mimeType ?? '',
          newImageTimestamp: Date.now().toString(),
        },
      });
    } catch (e) {
      console.error('Failed to pick image:', e);
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to pick image');
    } finally {
      setIsPicking(false);
    }
  };

  const handleOpenNote = () => {
    router.replace({
      pathname: '/board',
      params: { newNote: Date.now().toString() },
    });
  };

  const handleOpenLink = () => {
    router.replace({
      pathname: '/board',
      params: { newLink: Date.now().toString() },
    });
  };

  return (
    <SafeAreaView
      className="flex-1 bg-zinc-950 items-center justify-center p-6 pb-40"
      edges={['top']}
    >
      <View className="h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 mb-8">
        <PlusCircleIcon size={32} color="#3b82f6" weight="duotone" />
      </View>

      <Text className="font-sans-medium text-2xl text-white text-center w-full">
        Save <Text className="font-serif-italic text-2xl text-blue-500 text-center"> anything</Text>{' '}
        you want
      </Text>
      <Text className="font-sans text-base text-zinc-400 mt-3 text-center max-w-80">
        You can add notes, to-do's, quotes, links, X posts and Reddit posts, articles, books or
        YouTube vídeos
      </Text>

      <View className="mt-8 gap-4">
        <View className="flex-row flex-wrap justify-center gap-4">
          <Pressable
            onPress={handleOpenNote}
            className="p-6 max-w-80 justify-between h-40 w-40 bg-white rounded-xl active:opacity-80"
          >
            <NotePencilIcon size={24} color="#000" />
            <Text className="font-sans-semibold text-lg text-zinc-950">Note, quote or to-do</Text>
          </Pressable>

          <Pressable
            onPress={handleOpenLink}
            className="p-6 max-w-80 justify-between h-40 w-40 bg-zinc-800 rounded-xl active:opacity-80"
          >
            <LinkIcon size={24} color="#fff" />
            <Text className="font-sans-semibold text-lg text-white">Link from anywhere</Text>
          </Pressable>
        </View>

        <View className="flex-row flex-wrap justify-center gap-4">
          <Pressable
            // onPress={changeFolder}
            className="p-6 max-w-80 justify-between h-40 w-40 bg-zinc-800 rounded-xl"
          >
            <BookIcon size={24} color="#fff" />
            <Text className="font-sans-semibold text-lg text-white">Book for the library</Text>
          </Pressable>

          <Pressable
            onPress={handlePickImage}
            disabled={isPicking}
            className="p-6 max-w-80 justify-between h-40 w-40 bg-zinc-800 rounded-xl active:opacity-70"
          >
            {isPicking ? (
              <ActivityIndicator size={24} color="#fff" />
            ) : (
              <ImageSquareIcon size={24} color="#fff" />
            )}
            <Text className="font-sans-semibold text-lg text-white">Image from gallery</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
