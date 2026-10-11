import { XIcon } from 'phosphor-react-native';
import { Modal, Pressable, Text, View } from 'react-native';

import { PdfPreview } from '@/components/PdfPreview';
import type { LibraryItem } from '@/lib/library/types';

type PdfItem = Extract<LibraryItem, { type: 'pdf' }>;

export function CardPdfReader({
  item,
  visible,
  onClose,
  topInset,
}: {
  item: PdfItem;
  visible: boolean;
  onClose: () => void;
  topInset: number;
}) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-zinc-950" style={{ paddingTop: topInset }}>
        <View className="h-14 flex-row items-center px-4 border-b border-zinc-800">
          <Pressable
            onPress={onClose}
            hitSlop={12}
            className="w-10 h-10 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Close PDF"
          >
            <XIcon size={22} color="#FFFFFF" />
          </Pressable>
          <Text
            className="flex-1 font-sans-medium text-base text-white text-center"
            numberOfLines={1}
          >
            {item.originalFileName || item.title || 'PDF Document'}
          </Text>
          <View className="w-10" />
        </View>
        <View className="flex-1">
          <PdfPreview uri={item.pdf} fullReader />
        </View>
      </View>
    </Modal>
  );
}
