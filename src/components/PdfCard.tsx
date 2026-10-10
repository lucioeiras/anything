import { decodeHTML } from 'entities';
import { FilePdfIcon } from 'phosphor-react-native';
import { memo } from 'react';
import { Text, View } from 'react-native';

type PdfCardProps = {
  url: string;
  title?: string;
};

export const PdfCard = memo(function PdfCard({ url, title }: PdfCardProps) {
  // Extract a fallback title from the filename if not provided
  const displayTitle = title
    ? decodeHTML(title)
    : (() => {
        try {
          const parts = url.split('/');
          const filename = decodeURIComponent(parts[parts.length - 1] || '');
          return filename.replace(/\.pdf$/i, '') || 'PDF Document';
        } catch {
          return 'PDF Document';
        }
      })();

  return (
    <View className="w-full">
      {/* Visual Header / Document Preview Area */}
      <View className="w-full h-36 bg-red-950/20 border-b border-zinc-800/80 items-center justify-center relative overflow-hidden">
        {/* Subtle decorative background sheet */}
        <View className="w-20 h-24 bg-zinc-900 border border-zinc-800 rounded-sm shadow-md items-center justify-center relative">
          <FilePdfIcon size={36} color="#ef4444" weight="duotone" />
          <View className="absolute bottom-1.5 bg-red-500/20 px-1.5 py-0.5 rounded-[2px]">
            <Text className="text-[9px] font-sans-bold text-red-400 tracking-wider">PDF</Text>
          </View>
        </View>
      </View>

      {/* Info Content Area */}
      <View className="w-full p-4 gap-2 bg-zinc-900/40">
        <Text className="font-sans-medium text-base leading-[1.4] text-zinc-100" numberOfLines={2}>
          {displayTitle}
        </Text>

        <View className="flex-row items-center gap-1.5 mt-0.5">
          <FilePdfIcon size={13} color="#f87171" weight="bold" />
          <Text className="font-sans-semibold text-xs text-red-400/90 tracking-wide uppercase">
            PDF
          </Text>
        </View>
      </View>
    </View>
  );
});
