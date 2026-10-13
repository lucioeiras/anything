import { CaretDownIcon, CheckIcon, XIcon } from 'phosphor-react-native';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';

type Props = {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onSelect: (value: string) => void;
};
export function ProfileSelect({ label, value, options, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${options.find((o) => o.value === value)?.label ?? value}`}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(true)}
        hitSlop={{ top: 5, bottom: 5 }}
        className="shrink-0 flex-row items-center gap-2 rounded-full border border-zinc-700 px-4 py-2"
      >
        <Text className="font-sans-medium text-sm text-zinc-300">
          {options.find((o) => o.value === value)?.label ?? value}
        </Text>
        <CaretDownIcon size={16} color="#A1A1AA" />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View className="flex-1 justify-end bg-black/60">
          <SafeAreaView edges={['bottom']} className="max-h-[80%] rounded-t-3xl bg-zinc-950">
            <View className="flex-row items-center justify-between px-6 py-4">
              <Text className="font-sans-semibold text-xl text-white">{label}</Text>
              <Button
                accessibilityLabel={`Close ${label}`}
                size="small"
                icon={<XIcon size={20} color="#FFFFFF" />}
                onPress={() => setOpen(false)}
              />
            </View>
            <ScrollView contentContainerClassName="px-6 pb-6">
              {options.map((option) => (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityLabel={option.label}
                  accessibilityState={{ selected: option.value === value }}
                  className="min-h-14 flex-row items-center justify-between border-b border-zinc-800 py-3"
                  onPress={() => {
                    onSelect(option.value);
                    setOpen(false);
                  }}
                >
                  <Text className="font-sans text-base text-zinc-200">{option.label}</Text>
                  {option.value === value && <CheckIcon size={20} color="#FFFFFF" />}
                </Pressable>
              ))}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}
