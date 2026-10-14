import { HourglassIcon } from 'phosphor-react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { BookLogCalendarGrid } from '@/components/books/BookLogCalendarGrid';
import { BookLogModal } from '@/components/books/BookLogModal';
import { localDateKey, monthFromKey } from '@/components/books/bookLogDates';
import type { BookItem, BookReadingLog } from '@/lib/library/types';

const PROGRESS_RADIUS = 14;
const PROGRESS_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RADIUS;

export function BookLogs({
  book,
  onSave,
  onDelete,
  getNoteText,
  readOnly = false,
  openOnMount = false,
}: {
  book: BookItem;
  onSave: (
    date: string,
    page: number,
    note: string,
    totalPages?: number,
    existingLog?: BookReadingLog
  ) => Promise<void>;
  onDelete: (existingLog: BookReadingLog) => Promise<void>;
  getNoteText: (id: string) => string | undefined;
  readOnly?: boolean;
  openOnMount?: boolean;
}) {
  const logs = book.readingLogs ?? [];
  const latest = [...logs].sort((a, b) =>
    a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date)
  )[0];
  const total = book.pageCount && book.pageCount > 0 ? book.pageCount : null;
  const percentage = total ? Math.min(100, Math.round(((latest?.page ?? 0) / total) * 100)) : null;
  const [calendarMonth, setCalendarMonth] = useState(() => monthFromKey(localDateKey(new Date())));
  const [formOpen, setFormOpen] = useState(openOnMount);
  const [formSession, setFormSession] = useState(0);
  const [logToEdit, setLogToEdit] = useState<BookReadingLog>();
  const [noteToEdit, setNoteToEdit] = useState<string>();
  const [selectedLogDate, setSelectedLogDate] = useState<string | null>(null);

  return (
    <View className={`pb-0 border-b border-zinc-800 ${readOnly ? '' : 'pt-6 gap-5'}`}>
      {/* Header */}
      {readOnly ? (
        <View className="flex-row items-center gap-2 px-6 mt-7">
          <HourglassIcon size={14} color="#ffffff" weight="bold" />
          <Text className="font-sans-semibold text-sm tracking-wider uppercase text-zinc-200">
            Progress
          </Text>
        </View>
      ) : (
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2 px-6">
            <HourglassIcon size={14} color="#ffffff" weight="bold" />
            <Text className="font-sans-semibold text-sm tracking-wider uppercase text-zinc-200">
              Progress
            </Text>
          </View>

          {/* Progress */}
          <View
            className="flex-row items-center gap-3 px-6"
            accessible
            accessibilityLabel={`${percentage === null ? 'Progress unavailable' : `${percentage}% complete`}, page ${latest?.page ?? 0} of ${total ?? 'unknown'}`}
          >
            <Svg width={24} height={24} viewBox="0 0 36 36" accessible={false}>
              <Circle
                cx={18}
                cy={18}
                r={PROGRESS_RADIUS}
                stroke="#3F3F46"
                strokeWidth={4}
                fill="none"
              />
              {percentage !== null && (
                <Circle
                  cx={18}
                  cy={18}
                  r={PROGRESS_RADIUS}
                  stroke="#FBBF24"
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeDasharray={PROGRESS_CIRCUMFERENCE}
                  strokeDashoffset={PROGRESS_CIRCUMFERENCE * (1 - percentage / 100)}
                  rotation={-90}
                  origin="18, 18"
                  fill="none"
                />
              )}
            </Svg>

            <Text className="font-sans-semibold text-base text-white">
              {percentage === null ? '—' : percentage}%{'  '}
              <Text className="font-sans text-zinc-400">
                ({latest?.page ?? 0}/{total ?? '—'})
              </Text>
            </Text>
          </View>
        </View>
      )}

      {/* Calendar */}
      <View className={`mb-8 px-6 ${readOnly && 'py-6'}`}>
        <BookLogCalendarGrid
          month={calendarMonth}
          logs={logs}
          selectedDate={selectedLogDate ?? undefined}
          onChangeMonth={setCalendarMonth}
          onPressDate={(key) => {
            const dayLogs = logs.filter((log) => log.date === key);
            setSelectedLogDate(key);
            if (dayLogs.length > 0) {
              const targetLog = [...dayLogs].sort((a, b) =>
                b.createdAt.localeCompare(a.createdAt)
              )[0];
              setLogToEdit(targetLog);
              setNoteToEdit(targetLog.noteId ? getNoteText(targetLog.noteId) : undefined);
              setFormSession((session) => session + 1);
              setFormOpen(true);
            }
          }}
        />
      </View>

      <BookLogModal
        key={formSession}
        visible={formOpen}
        book={book}
        latestPage={latest?.page}
        existingLog={logToEdit}
        initialNote={noteToEdit}
        onSave={onSave}
        onDelete={onDelete}
        onSaved={(savedDate) => {
          setCalendarMonth(monthFromKey(savedDate));
          setSelectedLogDate(savedDate);
        }}
        onClose={() => setFormOpen(false)}
      />
    </View>
  );
}
