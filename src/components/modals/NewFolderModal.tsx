import { CheckIcon, FolderIcon, XIcon } from 'phosphor-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionFooter } from '@/components/ActionFooter';
import { Button } from '@/components/Button';
import { LocalizedText } from '@/components/LocalizedText';
import { translate, useLocalization } from '@/lib/i18n';

type NewFolderModalProps = {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<boolean>;
};

export function NewFolderModal({ visible, onClose, onCreate }: NewFolderModalProps) {
  useLocalization();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const canSave = name.trim().length > 0 && !saving;

  const handleClose = () => {
    if (saving) return;
    setName('');
    onClose();
  };

  const handleCreate = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const created = await onCreate(name.trim());
      if (created) {
        setName('');
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={{ paddingTop: Math.max(insets.top, 16) }} className="flex-1 w-full relative">
          <ScrollView
            className="flex-1 w-full"
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="gap-3 p-8 pt-0">
              <Text className="font-sans-semibold text-2xl text-white">
                <LocalizedText>Create a new folder</LocalizedText>
              </Text>
              <Text className="font-sans text-base text-zinc-400 leading-relaxed">
                <LocalizedText>
                  Add the folder name as a tag to any card to place it here.
                </LocalizedText>
              </Text>
            </View>

            <View className="flex-row items-center gap-4 py-5 px-8 border-t border-b border-zinc-800">
              <FolderIcon size={20} color="#D4D4D8" />
              <TextInput
                autoFocus
                value={name}
                onChangeText={setName}
                onSubmitEditing={handleCreate}
                returnKeyType="done"
                maxLength={40}
                placeholder={translate('Folder name')}
                placeholderTextColor="#71717A"
                accessibilityLabel={translate('Folder name')}
                className="flex-1 font-sans text-xl text-white leading-tight"
                style={styles.borderlessInput}
                underlineColorAndroid="transparent"
              />
              {name.length > 0 && (
                <Pressable
                  onPress={() => setName('')}
                  hitSlop={10}
                  className="p-1.5 rounded-full bg-zinc-800 items-center justify-center active:opacity-70"
                  accessibilityRole="button"
                  accessibilityLabel={translate('Clear folder name')}
                >
                  <XIcon size={12} color="#E4E4E7" weight="bold" />
                </Pressable>
              )}
            </View>
          </ScrollView>

          <ActionFooter bottomInset={insets.bottom}>
            <Button
              accessibilityLabel={translate('Cancel')}
              onPress={handleClose}
              disabled={saving}
              icon={<XIcon size={20} color="#FFFFFF" weight="bold" />}
              text={translate('Cancel')}
            />

            <Button
              accessibilityLabel={translate('Create folder')}
              variant="primary"
              onPress={handleCreate}
              disabled={!canSave}
              icon={
                saving ? (
                  <ActivityIndicator size={20} color="#000000" />
                ) : (
                  <CheckIcon size={20} color={canSave ? '#000000' : '#71717A'} weight="bold" />
                )
              }
              text={translate('Create folder')}
            />
          </ActionFooter>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#09090B',
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  borderlessInput: {
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
});
