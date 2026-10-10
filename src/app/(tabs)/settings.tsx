import React from 'react';
import { router } from 'expo-router';
import {
  ArrowsDownUpIcon,
  CheckCircleIcon,
  CpuIcon,
  DownloadSimpleIcon,
  FolderOpenIcon,
  SparkleIcon,
  TrashSimpleIcon,
  XCircleIcon,
} from 'phosphor-react-native';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLibrary } from '@/hooks/useLibrary';
import { useLocalAI } from '@/lib/ai/useLocalAI';

export default function SettingsScreen() {
  const { currentFolderName } = useLibrary();
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

  const changeFolder = () => {
    router.replace('/');
  };

  const handleConfirmDelete = () => {
    Alert.alert(
      'Remover modelo de IA',
      'Tem certeza que deseja apagar o modelo local? Você precisará baixá-lo novamente para usar o tagging por IA.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            await deleteModel();
          },
        },
      ]
    );
  };

  const formattedWrittenMb = (bytesWritten / (1024 * 1024)).toFixed(1);
  const formattedTotalMb = (totalBytes / (1024 * 1024)).toFixed(1);
  const percentage = Math.round(progress * 100);

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top']}>
      <ScrollView
        className="flex-1 px-6 pt-4"
        contentContainerStyle={{ paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="font-sans-bold text-3xl text-white mb-6">Settings</Text>

        {/* Space Section */}
        <View className="bg-zinc-900 border border-zinc-800/80 rounded-3xl p-5 mb-5">
          <View className="flex-row items-center gap-3 mb-3">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <FolderOpenIcon size={22} color="#3b82f6" weight="duotone" />
            </View>
            <View className="flex-1">
              <Text className="font-sans-semibold text-lg text-white">Current Space</Text>
              <Text className="font-serif-italic text-sm text-blue-400">{currentFolderName}</Text>
            </View>
          </View>

          <Text className="font-sans text-xs text-zinc-400 mb-4 leading-relaxed">
            All your cards, tags, and local files are isolated within this space folder.
          </Text>

          <Pressable
            onPress={changeFolder}
            className="px-4 py-2.5 flex-row items-center justify-center gap-2 bg-zinc-800 rounded-full active:opacity-80"
          >
            <ArrowsDownUpIcon size={16} color="#ffffff" />
            <Text className="font-sans-medium text-sm text-white">Change space folder</Text>
          </Pressable>
        </View>

        {/* On-Device AI Section */}
        <View className="bg-zinc-900 border border-zinc-800/80 rounded-3xl p-5 mb-5">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
                <CpuIcon size={22} color="#a855f7" weight="duotone" />
              </View>
              <View>
                <Text className="font-sans-semibold text-lg text-white">
                  Inteligência Artificial Local
                </Text>
                <Text className="font-sans text-xs text-zinc-400">
                  {modelConfig.displayName} ({modelConfig.sizeFormatted})
                </Text>
              </View>
            </View>

            {isDownloaded && (
              <View className="flex-row items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                <CheckCircleIcon size={14} color="#10b981" weight="fill" />
                <Text className="font-sans-medium text-xs text-emerald-400">Ativo</Text>
              </View>
            )}
            {!isDownloaded && !isDownloading && (
              <View className="flex-row items-center gap-1 bg-zinc-800 px-2.5 py-1 rounded-full">
                <Text className="font-sans-medium text-xs text-zinc-400">Disponível</Text>
              </View>
            )}
          </View>

          <Text className="font-sans text-xs text-zinc-400 mb-4 leading-relaxed">
            Executa um modelo neural compacto (Qwen 2.5) 100% no seu aparelho com aceleração GPU
            Metal. Analisa notas e links em profundidade para gerar tags conceituais inteligentes e
            respeitar seu vocabulário pessoal, sem enviar nenhum dado para a nuvem.
          </Text>

          {/* Download Progress */}
          {isDownloading && (
            <View className="bg-zinc-950/70 border border-zinc-800 p-4 rounded-2xl mb-4">
              <View className="flex-row justify-between items-center mb-2">
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator size="small" color="#a855f7" />
                  <Text className="font-sans-medium text-xs text-white">Baixando modelo...</Text>
                </View>
                <Text className="font-sans-mono text-xs text-purple-400 font-semibold">
                  {percentage}%
                </Text>
              </View>

              {/* Progress bar */}
              <View className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden mb-2">
                <View
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${Math.max(4, Math.min(100, percentage))}%` }}
                />
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="font-sans text-[11px] text-zinc-500">
                  {formattedWrittenMb} MB de {formattedTotalMb} MB
                </Text>
                <Pressable
                  onPress={cancelDownload}
                  className="flex-row items-center gap-1 active:opacity-70"
                >
                  <XCircleIcon size={14} color="#ef4444" />
                  <Text className="font-sans text-xs text-red-400">Cancelar</Text>
                </Pressable>
              </View>
            </View>
          )}

          {error && (
            <Text className="font-sans text-xs text-red-400 mb-3 bg-red-950/40 p-2.5 rounded-xl border border-red-900/50">
              {error}
            </Text>
          )}

          {/* Actions */}
          {!isDownloaded && !isDownloading && (
            <Pressable
              onPress={downloadModel}
              className="px-4 py-3 flex-row items-center justify-center gap-2 bg-purple-600 rounded-full active:opacity-80"
            >
              <DownloadSimpleIcon size={18} color="#ffffff" weight="bold" />
              <Text className="font-sans-semibold text-sm text-white">
                Baixar Modelo de IA ({modelConfig.sizeFormatted})
              </Text>
            </Pressable>
          )}

          {isDownloaded && (
            <View className="flex-row items-center justify-between pt-2 border-t border-zinc-800/60">
              <View className="flex-row items-center gap-1.5">
                <SparkleIcon size={15} color="#10b981" weight="duotone" />
                <Text className="font-sans text-xs text-zinc-300">Pronto para inferência</Text>
              </View>
              <Pressable
                onPress={handleConfirmDelete}
                className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-950/30 border border-red-900/40 active:opacity-70"
              >
                <TrashSimpleIcon size={13} color="#f87171" />
                <Text className="font-sans text-xs text-red-400">
                  Excluir ({modelConfig.sizeFormatted})
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
