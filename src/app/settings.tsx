import { router } from 'expo-router';
import {
  ArrowLeftIcon,
  ArrowsLeftRightIcon,
  CircleIcon,
  CpuIcon,
  DownloadSimpleIcon,
  FolderOpenIcon,
  MicrophoneIcon,
  TextTIcon,
  TranslateIcon,
  TrashSimpleIcon,
  XCircleIcon,
} from 'phosphor-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { LocalizedText } from '@/components/LocalizedText';
import { useLibrary } from '@/hooks/useLibrary';
import { useLocalAI } from '@/lib/ai/useLocalAI';
import { useWhisperModel } from '@/lib/ai/useWhisperModel';
import { useLocalization } from '@/lib/i18n';
import { languageOptions } from '@/lib/i18n/catalog';

export default function SettingsScreen() {
  const { preference, setPreference, t } = useLocalization();
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
  const whisper = useWhisperModel();

  const percentage = Math.round(Math.max(0, Math.min(1, progress)) * 100);
  const formattedWrittenMb = (bytesWritten / (1024 * 1024)).toFixed(1);
  const formattedTotalMb = (totalBytes / (1024 * 1024)).toFixed(1);
  const whisperPercentage = Math.round(Math.max(0, Math.min(1, whisper.progress)) * 100);
  const whisperWrittenMb = (whisper.bytesWritten / (1024 * 1024)).toFixed(1);
  const whisperTotalMb = (whisper.totalBytes / (1024 * 1024)).toFixed(1);

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
      t('Remove AI model'),
      t(
        'Remove the local model from this device? You can download it again whenever you need AI tags.'
      ),
      [
        { text: t('Cancel'), style: 'cancel' },
        { text: t('Remove'), style: 'destructive', onPress: () => void deleteModel() },
      ]
    );
  };

  const handleConfirmDeleteWhisper = () => {
    Alert.alert(t('Remove transcription model'), t('Remove Whisper from this device?'), [
      { text: t('Cancel'), style: 'cancel' },
      { text: t('Remove'), style: 'destructive', onPress: () => void whisper.deleteModel() },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top', 'left', 'right']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="pt-5 pb-40"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-8 pb-8 flex-row items-center gap-4">
          <Button
            accessibilityLabel={t('Back to profile')}
            size="small"
            icon={<ArrowLeftIcon size={20} color="#FFFFFF" />}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))}
          />
          <Text className="font-sans-semibold text-2xl text-white">
            <LocalizedText>Settings</LocalizedText>
          </Text>
        </View>

        <View className="gap-4 border-b border-zinc-800 px-8 pb-6">
          <View className="flex-row items-center gap-2">
            <TranslateIcon size={16} color="#E4E4E7" />
            <Text className="font-sans-semibold text-sm uppercase tracking-wider text-zinc-200">
              <LocalizedText>Language</LocalizedText>
            </Text>
          </View>
          <Text className="font-sans text-base leading-relaxed text-zinc-400">
            <LocalizedText>Choose the language used by Anything.</LocalizedText>
          </Text>
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel={t('Select app language')}
            className="gap-1"
          >
            {languageOptions.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => void setPreference(option.value)}
                accessibilityRole="radio"
                accessibilityLabel={t(option.label)}
                accessibilityState={{ checked: preference === option.value }}
                className="min-h-12 flex-row items-center gap-3 py-2 active:opacity-70"
              >
                <View
                  className={`h-5 w-5 items-center justify-center rounded-full border ${preference === option.value ? 'border-blue-400' : 'border-zinc-600'}`}
                >
                  {preference === option.value && (
                    <View className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                  )}
                </View>
                <Text className="font-sans text-base text-white">{t(option.label)}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="gap-4 border-t border-b border-zinc-800 px-8 py-6">
          <View className="flex-row items-center gap-2">
            <CircleIcon size={16} color="#E4E4E7" />
            <Text className="font-sans-semibold text-sm uppercase tracking-wider text-zinc-200">
              <LocalizedText>Current space</LocalizedText>
            </Text>
          </View>
          <Text className="font-sans text-base leading-relaxed text-zinc-400">
            <LocalizedText>
              Cards, tags and local files in this space are kept together in one folder.
            </LocalizedText>
          </Text>
          <Pressable
            onPress={handleChangeFolder}
            disabled={openingFolder}
            accessibilityRole="button"
            accessibilityLabel={t('Change space folder. Current space: %{name}', {
              name: currentFolderName,
            })}
            accessibilityState={{ disabled: openingFolder, busy: openingFolder }}
            className="min-h-14 flex-row items-center gap-4 py-2 active:opacity-70"
          >
            <FolderOpenIcon size={20} color="#D4D4D8" />
            <View className="flex-1">
              <Text className="font-sans text-xs text-zinc-500">
                <LocalizedText>Folder</LocalizedText>
              </Text>
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
            <TextTIcon size={16} color="#E4E4E7" />
            <Text className="font-sans-semibold text-sm uppercase tracking-wider text-zinc-200">
              <LocalizedText>AI Model for Texts</LocalizedText>
            </Text>
          </View>
          <Text className="font-sans text-base leading-relaxed text-zinc-400">
            <LocalizedText>
              Generate tags for notes and links with a model that runs on your device. After
              download, it works offline.
            </LocalizedText>
          </Text>
          <View className="flex-row items-center gap-3 py-2">
            <CpuIcon size={20} color="#D4D4D8" />
            <View className="min-w-0 flex-1">
              <Text className="font-sans text-lg leading-tight text-white" numberOfLines={2}>
                {modelConfig.displayName}
              </Text>
              <Text className="mt-1 font-sans text-sm text-zinc-500">
                {modelConfig.sizeFormatted} <LocalizedText>download</LocalizedText>
              </Text>
            </View>
            <Button
              accessibilityLabel={
                isDownloading
                  ? 'Cancel model download'
                  : isDownloaded
                    ? 'Remove downloaded AI model'
                    : 'Download AI model'
              }
              icon={
                isDownloading ? (
                  <XCircleIcon size={20} color="#E4E4E7" />
                ) : isDownloaded ? (
                  <TrashSimpleIcon size={20} color="#F87171" />
                ) : (
                  <DownloadSimpleIcon size={20} color="#60A5FA" weight="bold" />
                )
              }
              onPress={
                isDownloading ? cancelDownload : isDownloaded ? handleConfirmDelete : downloadModel
              }
              size="small"
              variant="secondary"
              contentColor={isDownloaded ? '#F87171' : isDownloading ? '#E4E4E7' : '#60A5FA'}
            />
          </View>
        </View>

        <View className="px-8 pb-6 mt-4">
          {isDownloading && (
            <View className="gap-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <ActivityIndicator size="small" color="#3B82F6" />
                  <Text className="font-sans-semibold text-sm text-zinc-200">
                    <LocalizedText>Downloading model</LocalizedText>
                  </Text>
                </View>
                <Text className="font-sans-semibold text-sm text-blue-500">
                  {percentage}
                  <LocalizedText>%</LocalizedText>
                </Text>
              </View>
              <View className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                <View className="h-full bg-blue-500" style={{ width: `${percentage}%` }} />
              </View>
              <Text className="font-sans text-xs text-zinc-500">
                {formattedWrittenMb} <LocalizedText>/ </LocalizedText>
                {formattedTotalMb} <LocalizedText>MB</LocalizedText>
              </Text>
            </View>
          )}
          {error && <Text className="mt-4 font-sans text-sm text-red-400">{error}</Text>}
        </View>

        <View className="gap-4 border-t border-zinc-800 px-8 pt-6">
          <View className="flex-row items-center gap-2">
            <MicrophoneIcon size={16} color="#E4E4E7" />
            <Text className="font-sans-semibold text-sm uppercase tracking-wider text-zinc-200">
              <LocalizedText>AI Model for Audio</LocalizedText>
            </Text>
          </View>
          <Text className="font-sans text-base leading-relaxed text-zinc-400">
            <LocalizedText>
              Transcribe recorded audios on this device. The model works offline after download.
            </LocalizedText>
          </Text>
          <View className="flex-row items-center gap-3 py-2">
            <CpuIcon size={20} color="#D4D4D8" />
            <View className="min-w-0 flex-1">
              <Text className="font-sans text-lg leading-tight text-white" numberOfLines={2}>
                {whisper.modelConfig.displayName}
              </Text>
              <Text className="mt-1 font-sans text-sm text-zinc-500">
                {whisper.modelConfig.sizeFormatted} <LocalizedText>download</LocalizedText>
              </Text>
            </View>
            <Button
              accessibilityLabel={
                whisper.isDownloading
                  ? 'Cancel transcription model download'
                  : whisper.isDownloaded
                    ? 'Remove downloaded transcription model'
                    : 'Download transcription model'
              }
              icon={
                whisper.isDownloading ? (
                  <XCircleIcon size={20} color="#E4E4E7" />
                ) : whisper.isDownloaded ? (
                  <TrashSimpleIcon size={20} color="#F87171" />
                ) : (
                  <DownloadSimpleIcon size={20} color="#60A5FA" weight="bold" />
                )
              }
              onPress={
                whisper.isDownloading
                  ? whisper.cancelDownload
                  : whisper.isDownloaded
                    ? handleConfirmDeleteWhisper
                    : whisper.downloadModel
              }
              size="small"
              variant="secondary"
              contentColor={
                whisper.isDownloaded ? '#F87171' : whisper.isDownloading ? '#E4E4E7' : '#60A5FA'
              }
            />
          </View>
        </View>
        <View className="px-8 pb-6 mt-4">
          {whisper.isDownloading && (
            <View className="gap-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <ActivityIndicator size="small" color="#3B82F6" />
                  <Text className="font-sans-semibold text-sm text-zinc-200">
                    <LocalizedText>Downloading model</LocalizedText>
                  </Text>
                </View>
                <Text className="font-sans-semibold text-sm text-blue-500">
                  {whisperPercentage}
                  <LocalizedText>%</LocalizedText>
                </Text>
              </View>
              <View className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                <View className="h-full bg-blue-500" style={{ width: `${whisperPercentage}%` }} />
              </View>
              <Text className="font-sans text-xs text-zinc-500">
                {whisperWrittenMb} <LocalizedText>/ </LocalizedText>
                {whisperTotalMb} <LocalizedText>MB</LocalizedText>
              </Text>
            </View>
          )}
          {whisper.error && (
            <Text className="mt-4 font-sans text-sm text-red-400">{whisper.error}</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
