import { Image } from 'expo-image';
import { router } from 'expo-router';
import { BookOpenIcon, CaretLeftIcon, CaretRightIcon, XIcon } from 'phosphor-react-native';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { localDayKey, parseDayKey } from '@/lib/library/activity';
import { getReadingActivity } from '@/lib/library/readingActivity';
import type { BookItem, LibraryItem } from '@/lib/library/types';

const COLORS = { streak: '#60A5FA', reading: '#3F3F46', empty: '#18181B' };

export function ReadingCalendarSection({ items }: { items: LibraryItem[] }) {
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const year = month.getFullYear();
  const today = localDayKey(new Date());
  const activity = useMemo(
    () => getReadingActivity(items, year, parseDayKey(today)!),
    [items, year, today]
  );
  const selectedBooks = selectedDay ? (activity.byDay[selectedDay] ?? []) : [];
  const firstWeekday = new Date(year, month.getMonth(), 1).getDay();
  const days = new Date(year, month.getMonth() + 1, 0).getDate();
  const cells = Array.from(
    { length: Math.ceil((firstWeekday + days) / 7) * 7 },
    (_, index) => index - firstWeekday + 1
  );
  const openBook = (book: BookItem) => {
    setSelectedDay(null);
    router.push({ pathname: '/card/[id]', params: { id: book.id } });
  };
  return (
    <View className="border-t border-zinc-800 px-8 py-6">
      <Text className="font-sans-semibold text-sm uppercase tracking-wider text-zinc-200">
        Reading activity
      </Text>
      <View className="my-4 gap-1">
        <Text className="font-sans text-sm text-zinc-400">Best reading streak in {year}</Text>
        <Text
          accessibilityLabel={`Best reading streak in ${year}: ${activity.bestStreak} days`}
          className="font-sans-semibold text-3xl text-blue-400"
        >
          {activity.bestStreak} {activity.bestStreak === 1 ? 'day' : 'days'}
        </Text>
      </View>
      <View className="mb-4 flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous reading month"
          className="h-12 w-12 items-start justify-center"
          onPress={() => {
            setSelectedDay(null);
            setMonth(new Date(year, month.getMonth() - 1, 1));
          }}
        >
          <CaretLeftIcon size={18} color="#D4D4D8" />
        </Pressable>
        <Text className="font-sans-semibold text-base text-white">
          {month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next reading month"
          className="h-12 w-12 items-end justify-center"
          onPress={() => {
            setSelectedDay(null);
            setMonth(new Date(year, month.getMonth() + 1, 1));
          }}
        >
          <CaretRightIcon size={18} color="#D4D4D8" />
        </Pressable>
      </View>
      <View className="mb-2 flex-row">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <Text key={index} className="flex-1 text-center font-sans-medium text-xs text-zinc-500">
            {day}
          </Text>
        ))}
      </View>
      <View className="flex-row flex-wrap">
        {cells.map((day, index) => {
          if (day < 1 || day > days)
            return <View key={index} style={{ width: '14.2857%', height: 64 }} />;
          const date = new Date(year, month.getMonth(), day);
          const key = localDayKey(date);
          const books = activity.byDay[key] ?? [];
          const streak = activity.bestStreakDays.has(key);
          const backgroundColor = streak
            ? COLORS.streak
            : books.length
              ? COLORS.reading
              : COLORS.empty;
          return (
            <Pressable
              key={key}
              disabled={books.length === 0}
              accessibilityRole={books.length ? 'button' : 'text'}
              accessibilityLabel={`${date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}, ${books.length} books logged${streak ? ', best reading streak' : ''}${books.length ? `, ${books.map((book) => book.title).join(', ')}` : ''}`}
              onPress={() => (books.length === 1 ? openBook(books[0]) : setSelectedDay(key))}
              style={{ width: '14.2857%', height: 64, padding: 2 }}
            >
              <View
                testID={`reading-day-${key}`}
                style={{ backgroundColor }}
                className={`flex-1 overflow-hidden rounded-xl p-1.5 ${key === today ? 'border border-white' : ''}`}
              >
                <Text
                  className={`font-sans-medium text-xs ${streak ? 'text-zinc-950' : books.length ? 'text-white' : 'text-zinc-500'}`}
                >
                  {day}
                </Text>
                <View
                  className="flex-1 items-center justify-end"
                  pointerEvents="none"
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                >
                  {books.slice(0, 3).map((book, coverIndex) => (
                    <View
                      key={book.id}
                      testID={`reading-stack-${key}-${book.id}`}
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: '50%',
                        marginLeft: -8 + (coverIndex - (Math.min(books.length, 3) - 1) / 2) * 2,
                        width: 16,
                        height: 24,
                        zIndex: coverIndex,
                      }}
                    >
                      <ReadingCover key={book.cover ?? book.id} book={book} />
                    </View>
                  ))}
                  {books.length > 3 && (
                    <View
                      className="absolute bottom-0 right-0 rounded-tl bg-zinc-950/90 px-1"
                      style={{ zIndex: 4 }}
                    >
                      <Text className="font-sans-bold text-[10px] text-white">
                        +{books.length - 3}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
      <View className="mt-4 flex-row flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <Legend color={COLORS.streak} label={`Best ${year} streak`} />
        <Legend color={COLORS.reading} label="Days read" />
        <Legend color={COLORS.empty} label="No reading" />
      </View>
      {activity.readingDays === 0 && (
        <Text className="mt-4 font-sans text-sm text-zinc-500">
          No reading logs recorded for {year}.
        </Text>
      )}
      <Modal
        visible={selectedBooks.length > 0}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedDay(null)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <SafeAreaView edges={['bottom']} className="max-h-[80%] rounded-t-3xl bg-zinc-950">
            <View className="flex-row items-center justify-between gap-4 px-6 py-4">
              <Text className="flex-1 font-sans-semibold text-xl text-white">
                {selectedDay ? parseDayKey(selectedDay)?.toLocaleDateString() : 'Reading logs'}
              </Text>
              <Button
                accessibilityLabel="Close reading books"
                size="small"
                icon={<XIcon size={20} color="#FFFFFF" />}
                onPress={() => setSelectedDay(null)}
              />
            </View>
            <ScrollView contentContainerClassName="px-6 pb-6">
              {selectedBooks.map((book) => (
                <Pressable
                  key={book.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Open reading book ${book.title}`}
                  onPress={() => openBook(book)}
                  className="min-h-16 flex-row items-center gap-4 border-b border-zinc-800 py-3"
                >
                  <View style={{ width: 32, height: 48 }}>
                    <ReadingCover key={book.cover ?? book.id} book={book} />
                  </View>
                  <View className="flex-1 gap-1">
                    <Text className="font-sans-medium text-base text-zinc-200">{book.title}</Text>
                    <Text className="font-sans text-xs text-zinc-500">
                      {book.authors.join(', ')}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

function ReadingCover({ book }: { book: BookItem }) {
  const [failed, setFailed] = useState(false);
  return book.cover && !failed ? (
    <Image
      key={book.cover}
      source={{ uri: book.cover }}
      contentFit="cover"
      style={{ width: '100%', height: '100%', borderRadius: 2 }}
      onError={() => setFailed(true)}
    />
  ) : (
    <View className="flex-1 items-center justify-center rounded-sm bg-zinc-800">
      <BookOpenIcon size={14} color="#A1A1AA" />
    </View>
  );
}
function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View style={{ backgroundColor: color, width: 10, height: 10, borderRadius: 3 }} />
      <Text className="font-sans text-[10px] text-zinc-400">{label}</Text>
    </View>
  );
}
