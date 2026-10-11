import { router } from 'expo-router';
import {
  ArrowsLeftRightIcon,
  CircleIcon,
  CpuIcon,
  DownloadSimpleIcon,
  FolderOpenIcon,
  TrashSimpleIcon,
  XCircleIcon,
} from 'phosphor-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLibrary } from '@/hooks/useLibrary';
import { useLocalAI } from '@/lib/ai/useLocalAI';

export default function SettingsScreen() {
  const { currentFolderName, pickAndOpenFolder } = useLibrary();
  const [openingFolder, setOpeningFolder] = useState(false);
  const {
    modelConfig,
    isDownloaded,
    isDownloading,
    progress,
    bytesWritten,
    totalBytes,
    error,
    downloadModel,
    cancelDownload,
    deleteModel,
  } = useLocalAI();

  const percentage = Math.round(Math.max(0, Math.min(1, progress)) * 100);
  const formattedWrittenMb = (bytesWritten / (1024 * 1024)).toFixed(1);
  const formattedTotalMb = (totalBytes / (1024 * 1024)).toFixed(1);

  const handleChangeFolder = async () => {
    if (openingFolder) return;
    setOpeningFolder(true);
    try {
      if (await pickAndOpenFolder()) {
        router.replace('/board');
      }
    } finally {
      setOpeningFolder(false);
    }
  };

  const handleConfirmDelete = () => {
    Alert.alert(
      'Remove AI model',
      'Remove the local model from this device? You can download it again whenever you need AI tags.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => void deleteModel() },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top', 'left', 'right']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="pt-5 pb-16"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-3 px-8 pb-8">
          <Text className="font-sans-semibold text-2xl text-white">Settings</Text>
          <Text className="font-sans text-base leading-relaxed text-zinc-400">
            Manage your library space and the tools available on this device.
          </Text>
        </View>

        <View className="gap-4 border-t border-b border-zinc-800 px-8 py-6">
          <View className="flex-row items-center gap-2">
            <CircleIcon size={16} color="#E4E4E7" />
            <Text className="font-sans-semibold text-sm uppercase tracking-wider text-zinc-200">
              Current space
            </Text>
          </View>
          <Text className="font-sans text-base leading-relaxed text-zinc-400">
            Cards, tags and local files in this space are kept together in one folder.
          </Text>
          <Pressable
            onPress={handleChangeFolder}
            disabled={openingFolder}
            accessibilityRole="button"
            accessibilityLabel={`Change space folder. Current space: ${currentFolderName}`}
            accessibilityState={{ disabled: openingFolder, busy: openingFolder }}
            className="min-h-14 flex-row items-center gap-4 py-2 active:opacity-70"
          >
            <FolderOpenIcon size={20} color="#D4D4D8" />
            <View className="flex-1">
              <Text className="font-sans text-xs text-zinc-500">Folder</Text>
              <Text className="font-sans text-xl leading-tight text-white" numberOfLines={2}>
                {currentFolderName}
              </Text>
            </View>
            {openingFolder ? (
              <ActivityIndicator size="small" color="#71717A" />
            ) : (
              <ArrowsLeftRightIcon size={20} color="#A1A1AA" />
            )}
          </Pressable>
        </View>

        <View className="gap-4 px-8 pt-6">
          <View className="flex-row items-center gap-2">
            <CpuIcon size={16} color="#E4E4E7" />
            <Text className="font-sans-semibold text-sm uppercase tracking-wider text-zinc-200">
              On-device AI
            </Text>
          </View>
          <Text className="font-sans text-base leading-relaxed text-zinc-400">
            Generate tags for notes and links with a model that runs on your device. After download,
            it works offline.
          </Text>
          <View className="flex-row items-center gap-4 py-2">
            <CpuIcon size={20} color="#D4D4D8" />
            <View className="flex-1">
              <Text className="font-sans text-xl leading-tight text-white">
                {modelConfig.displayName}
              </Text>
              <Text className="mt-1 font-sans text-sm text-zinc-500">
                {modelConfig.sizeFormatted} download
              </Text>
            </View>
          </View>
        </View>

        <View className="px-8 pb-6">
          {isDownloading ? (
            <View className="gap-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <ActivityIndicator size="small" color="#3B82F6" />
                  <Text className="font-sans-semibold text-sm text-zinc-200">
                    Downloading model
                  </Text>
                </View>
                <Text className="font-sans-semibold text-sm text-blue-500">{percentage}%</Text>
              </View>
              <View className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                <View className="h-full bg-blue-500" style={{ width: `${percentage}%` }} />
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="font-sans text-xs text-zinc-500">
                  {formattedWrittenMb} / {formattedTotalMb} MB
                </Text>
                <Pressable
                  onPress={cancelDownload}
                  accessibilityRole="button"
                  className="min-h-11 flex-row items-center gap-2 active:opacity-70"
                >
                  <XCircleIcon size={18} color="#E4E4E7" />
                  <Text className="font-sans-semibold text-sm text-zinc-200">Cancel</Text>
                </Pressable>
              </View>
            </View>
          ) : isDownloaded ? (
            <View className="gap-5">
              <Pressable
                onPress={handleConfirmDelete}
                accessibilityRole="button"
                accessibilityLabel="Remove downloaded AI model"
                className="min-h-12 flex-row items-center gap-4 active:opacity-70"
              >
                <TrashSimpleIcon size={16} color="#DC2626" />
                <Text className="font-sans-semibold text-base text-red-600">Remove model</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={downloadModel}
              accessibilityRole="button"
              className="flex-row items-center gap-4 active:opacity-70"
            >
              <DownloadSimpleIcon size={16} color="#3B82F6" weight="bold" />
              <Text className="font-sans-semibold text-base text-blue-500">Download model</Text>
            </Pressable>
          )}
          {error && <Text className="mt-4 font-sans text-sm text-red-400">{error}</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
