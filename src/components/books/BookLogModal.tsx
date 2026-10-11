import {
  CalendarBlankIcon,
  CheckIcon,
  NotePencilIcon,
  TrashSimpleIcon,
  XIcon,
} from 'phosphor-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BookLogCalendarGrid } from '@/components/books/BookLogCalendarGrid';
import { localDateKey, monthFromKey } from '@/components/books/bookLogDates';
import type { BookItem, BookReadingLog } from '@/lib/library/types';

type BookLogModalProps = {
  visible: boolean;
  book: BookItem;
  latestPage?: number;
  existingLog?: BookReadingLog;
  initialNote?: string;
  onSave: (
    date: string,
    page: number,
    note: string,
    totalPages?: number,
    existingLog?: BookReadingLog
  ) => Promise<void>;
  onDelete: (existingLog: BookReadingLog) => Promise<void>;
  onSaved: (date: string) => void;
  onClose: () => void;
};

export function BookLogModal({
  visible,
  book,
  latestPage,
  existingLog,
  initialNote,
  onSave,
  onDelete,
  onSaved,
  onClose,
}: BookLogModalProps) {
  const insets = useSafeAreaInsets();
  const [formMonth, setFormMonth] = useState(() =>
    monthFromKey(existingLog?.date ?? localDateKey(new Date()))
  );
  const [date, setDate] = useState(() => existingLog?.date ?? localDateKey(new Date()));
  const [page, setPage] = useState(() =>
    existingLog ? String(existingLog.page) : latestPage === undefined ? '' : String(latestPage)
  );
  const [totalPages, setTotalPages] = useState(() =>
    book.pageCount ? String(book.pageCount) : ''
  );
  const [note, setNote] = useState(initialNote ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const close = () => {
    if (!saving) onClose();
  };

  const save = async () => {
    const currentPage = Number(page);
    const enteredTotal = totalPages.trim() ? Number(totalPages) : undefined;
    const effectiveTotal =
      enteredTotal ?? (book.pageCount && book.pageCount > 0 ? book.pageCount : null);
    if (
      enteredTotal !== undefined &&
      (!/^\d+$/.test(totalPages.trim()) || !Number.isSafeInteger(enteredTotal) || enteredTotal < 1)
    ) {
      setError('Enter a valid total page count.');
      return;
    }
    if (
      !/^\d+$/.test(page.trim()) ||
      !Number.isSafeInteger(currentPage) ||
      (effectiveTotal !== null && effectiveTotal !== undefined && currentPage > effectiveTotal)
    ) {
      setError(
        effectiveTotal
          ? `Enter a page between 0 and ${effectiveTotal}.`
          : 'Enter a valid page number.'
      );
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(date, currentPage, note.trim(), enteredTotal, existingLog);
      onSaved(date);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save reading log.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!existingLog || saving) return;
    Alert.alert('Remove reading log?', 'This reading entry will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          setError('');
          try {
            await onDelete(existingLog);
            onClose();
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Could not remove reading log.');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={close}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-zinc-950"
      >
        <View className="flex-1" style={{ paddingTop: Math.max(insets.top, 16) }}>
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingTop: 20, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="gap-3 px-8 pb-8">
              <Text className="font-sans-semibold text-2xl text-white">Log reading</Text>
              <Text className="font-sans text-base text-zinc-400 leading-relaxed">
                Track where you are in this book and save a thought from today.
              </Text>
            </View>

            <View className="border-t border-b border-zinc-800 px-8 py-6 gap-5">
              <View className="flex-row items-center gap-2">
                <CalendarBlankIcon size={14} color="#E4E4E7" weight="bold" />
                <Text className="font-sans-semibold text-sm tracking-wider uppercase text-zinc-200">
                  Reading date
                </Text>
              </View>

              <BookLogCalendarGrid
                month={formMonth}
                logs={[]}
                selectedDate={date}
                onChangeMonth={setFormMonth}
                onPressDate={setDate}
              />
            </View>

            <View className="flex-row gap-6 border-b border-zinc-800">
              <TextInput
                value={page}
                onChangeText={setPage}
                keyboardType="number-pad"
                placeholder="Current page"
                placeholderTextColor="#71717A"
                accessibilityLabel="Current page"
                className="font-sans text-lg text-white flex-1 px-8 py-6 leading-tight border-r border-zinc-800"
              />
              <TextInput
                value={totalPages}
                onChangeText={setTotalPages}
                keyboardType="number-pad"
                placeholder="Total pages"
                placeholderTextColor="#71717A"
                accessibilityLabel="Total pages"
                className="font-sans text-lg text-white flex-1 px-8 py-6 leading-tight"
              />
            </View>

            <View className="px-8 py-6 gap-4">
              <View className="flex-row items-center gap-2">
                <NotePencilIcon size={14} color="#E4E4E7" weight="bold" />
                <Text className="font-sans-semibold text-sm tracking-wider uppercase text-zinc-200">
                  Note
                </Text>
              </View>
              <TextInput
                value={note}
                onChangeText={setNote}
                multiline
                textAlignVertical="top"
                placeholder="What stood out today?"
                placeholderTextColor="#71717A"
                accessibilityLabel="Reading note"
                className="min-h-24 font-sans text-base text-zinc-100 leading-relaxed"
              />
            </View>

            {!!error && (
              <View className="mx-8 rounded-xl border border-rose-800/60 bg-rose-950/40 p-4">
                <Text className="font-sans text-sm text-rose-300 leading-relaxed">{error}</Text>
              </View>
            )}
          </ScrollView>

          <View className="flex-row border-t border-zinc-800 bg-zinc-950">
            <Pressable
              onPress={close}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              className="flex-1 flex-row items-center justify-center gap-3 border-r border-zinc-800 pt-6 active:bg-zinc-900"
              style={{ paddingBottom: Math.max(insets.bottom, 24) }}
            >
              <XIcon size={20} color="#FFFFFF" weight="bold" />
              <Text className="font-sans-bold text-lg text-white">Cancel</Text>
            </Pressable>
            {existingLog && (
              <Pressable
                onPress={confirmDelete}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Remove reading log"
                className="flex-1 flex-row items-center justify-center gap-3 border-r border-zinc-800 pt-6 active:bg-zinc-900"
                style={{ paddingBottom: Math.max(insets.bottom, 24) }}
              >
                <TrashSimpleIcon size={20} color="#F87171" />
                <Text className="font-sans-semibold text-lg text-rose-400">Remove</Text>
              </Pressable>
            )}
            <Pressable
              onPress={save}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Save reading log"
              className="flex-1 flex-row items-center justify-center gap-3 pt-6 active:bg-zinc-900"
              style={{ paddingBottom: Math.max(insets.bottom, 24) }}
            >
              {saving ? (
                <ActivityIndicator size={20} color="#F59E0B" />
              ) : (
                <CheckIcon size={20} color="#F59E0B" weight="bold" />
              )}
              <Text className="font-sans-semibold text-lg text-amber-500">Save log</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
