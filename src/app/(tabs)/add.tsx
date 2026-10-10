import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import {
  BookIcon,
  FilePdfIcon,
  FilmSlateIcon,
  GameControllerIcon,
  ImageSquareIcon,
  LinkIcon,
  MusicNotesIcon,
  NotePencilIcon,
} from 'phosphor-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
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

  const [isPickingPdf, setIsPickingPdf] = useState(false);

  const handlePickPdf = async () => {
    if (isPickingPdf) return;

    try {
      setIsPickingPdf(true);
      const result = await File.pickFileAsync({
        mimeTypes: ['application/pdf'],
      });

      if (result.canceled || !result.result) {
        return;
      }

      const file = result.result;

      router.replace({
        pathname: '/board',
        params: {
          newPdfUri: file.uri,
          newPdfFileName: file.name ?? '',
          newPdfTimestamp: Date.now().toString(),
        },
      });
    } catch (e) {
      console.error('Failed to pick PDF:', e);
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to pick PDF');
    } finally {
      setIsPickingPdf(false);
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

  const handleOpenBook = () => {
    router.replace({
      pathname: '/board',
      params: { newBook: Date.now().toString() },
    });
  };

  const handleOpenMovie = () => {
    router.replace({
      pathname: '/board',
      params: { newMovie: Date.now().toString() },
    });
  };

  const handleOpenMusic = () => {
    router.replace({
      pathname: '/board',
      params: { newMusic: Date.now().toString() },
    });
  };

  const handleOpenGame = () => {
    router.replace({
      pathname: '/board',
      params: { newGame: Date.now().toString() },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950 items-center justify-center" edges={['top']}>
      <ScrollView
        contentContainerStyle={{
          alignItems: 'center',
          justifyContent: 'center',
          flexGrow: 1,
          paddingVertical: 16,
        }}
        showsVerticalScrollIndicator={false}
        className="w-full"
      >
        <Text className="font-sans-medium text-2xl text-white text-center w-full">
          Save <Text className="text-2xl text-blue-500 text-center"> anything</Text> you want
        </Text>
        <Text className="font-sans text-base text-zinc-400 mt-3 text-center max-w-96">
          You can add notes, to-do's, quotes, links, movies, games, PDFs, songs, X posts and Reddit
          posts, articles, books or YouTube videos
        </Text>

        <View className="mt-10 gap-4">
          <View className="flex-row flex-wrap justify-center gap-4">
            <Pressable
              onPress={handleOpenNote}
              className="p-6 max-w-80 justify-between h-40 w-40 bg-white active:opacity-80 rounded-xl"
            >
              <NotePencilIcon size={24} color="#000" weight="duotone" />
              <Text className="font-sans-semibold text-lg text-zinc-950">Note, quote or to-do</Text>
            </Pressable>

            <Pressable
              onPress={handleOpenLink}
              className="p-6 max-w-80 justify-between h-40 w-40 bg-zinc-900 active:opacity-80 rounded-xl"
            >
              <LinkIcon size={24} color="#fff" weight="duotone" />
              <Text className="font-sans-semibold text-lg text-white">Link from anywhere</Text>
            </Pressable>
          </View>

          <View className="flex-row flex-wrap justify-center gap-4">
            <Pressable
              onPress={handlePickPdf}
              disabled={isPickingPdf}
              className="p-6 max-w-80 justify-between h-40 w-40 bg-zinc-900 active:opacity-70 rounded-xl"
            >
              {isPickingPdf ? (
                <ActivityIndicator size={24} color="#fff" />
              ) : (
                <FilePdfIcon size={24} color="#fff" weight="duotone" />
              )}
              <Text className="font-sans-semibold text-lg text-white">PDF document</Text>
            </Pressable>

            <Pressable
              onPress={handlePickImage}
              disabled={isPicking}
              className="p-6 max-w-80 justify-between h-40 w-40 bg-zinc-900 active:opacity-70 rounded-xl"
            >
              {isPicking ? (
                <ActivityIndicator size={24} color="#fff" />
              ) : (
                <ImageSquareIcon size={24} color="#fff" weight="duotone" />
              )}
              <Text className="font-sans-semibold text-lg text-white">Image from gallery</Text>
            </Pressable>
          </View>

          <View className="flex-row flex-wrap justify-center gap-4">
            <Pressable
              onPress={handleOpenBook}
              className="p-6 max-w-80 justify-between h-40 w-40 bg-zinc-900 active:opacity-80 rounded-xl"
            >
              <BookIcon size={24} color="#fff" weight="duotone" />
              <Text className="font-sans-semibold text-lg text-white">Book for the library</Text>
            </Pressable>

            <Pressable
              onPress={handleOpenMusic}
              className="p-6 max-w-80 justify-between h-40 w-40 bg-zinc-900 active:opacity-80 rounded-xl"
            >
              <MusicNotesIcon size={24} color="#fff" weight="duotone" />
              <Text className="font-sans-semibold text-lg text-white">A good song or album</Text>
            </Pressable>
          </View>

          <View className="flex-row flex-wrap justify-center gap-4">
            <Pressable
              onPress={handleOpenMovie}
              className="p-6 max-w-80 justify-between h-40 w-40 bg-zinc-900 active:opacity-80 rounded-xl"
            >
              <FilmSlateIcon size={24} color="#FFFFFF" weight="duotone" />
              <Text className="font-sans-semibold text-lg text-white">An amazing movie</Text>
            </Pressable>

            <Pressable
              onPress={handleOpenGame}
              className="p-6 max-w-80 justify-between h-40 w-40 bg-zinc-900 active:opacity-80 rounded-xl"
            >
              <GameControllerIcon size={24} color="#FFFFFF" weight="duotone" />
              <Text className="font-sans-semibold text-lg text-white">A wonderful game</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
