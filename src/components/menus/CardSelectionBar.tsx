import { FolderPlusIcon, PushPinSimpleIcon, TrashSimpleIcon, XIcon } from 'phosphor-react-native';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { LocalizedText } from '@/components/LocalizedText';
import { translate, useLocalization } from '@/lib/i18n';

type CardSelectionBarProps = {
  visible: boolean;
  selectedCount: number;
  bottomOffset?: number;
  onDelete: () => void;
  onAddToFolder: () => void;
  pinActionLabel?: string;
  onTogglePin?: () => void;
  onCancel: () => void;
};

export function CardSelectionBar({
  visible,
  selectedCount,
  bottomOffset = 0,
  onDelete,
  onAddToFolder,
  pinActionLabel,
  onTogglePin,
  onCancel,
}: CardSelectionBarProps) {
  useLocalization();
  if (!visible) return null;

  const hasSelection = selectedCount > 0;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        right: 0,
        bottom: bottomOffset,
        left: 0,
        alignItems: 'center',
      }}
    >
      <View className="items-center gap-3">
        <View className="flex-row items-center gap-2">
          <Button
            accessibilityLabel={translate('Cancel selection')}
            variant="secondary"
            icon={<XIcon size={24} color="#FFFFFF" weight="bold" />}
            onPress={onCancel}
          />
          <Button
            accessibilityLabel={translate('Add selected cards to folder')}
            variant="secondary"
            contentColor="#FFFFFF"
            icon={<FolderPlusIcon size={24} color="#FFFFFF" weight="bold" />}
            disabled={!hasSelection}
            onPress={onAddToFolder}
          />
          {pinActionLabel && onTogglePin && (
            <Button
              accessibilityLabel={pinActionLabel}
              variant="secondary"
              contentColor="#FFFFFF"
              icon={<PushPinSimpleIcon size={24} color="#FFFFFF" weight="bold" />}
              disabled={!hasSelection}
              onPress={onTogglePin}
            />
          )}
          <Button
            accessibilityLabel={translate('Delete selected cards')}
            variant="secondary"
            shadowColor="#EF4444"
            shadowOpacity={hasSelection ? 0.2 : 0}
            icon={
              <TrashSimpleIcon
                size={24}
                color={hasSelection ? '#EF4444' : '#A1A1AA'}
                weight="bold"
              />
            }
            disabled={!hasSelection}
            onPress={onDelete}
          />
        </View>

        <Text className="font-sans-medium text-base text-white">
          {hasSelection ? (
            <>
              <Text className="text-white font-sans-bold">
                {selectedCount}
                {'  '}
              </Text>
              <Text className="text-zinc-400 font-sans-semibold">
                {' '}
                <LocalizedText>selected</LocalizedText>
              </Text>
            </>
          ) : (
            <Text className="text-zinc-400">
              <LocalizedText>Select cards</LocalizedText>
            </Text>
          )}
        </Text>
      </View>
    </View>
  );
}
