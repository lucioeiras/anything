import { CaretLeftIcon, CaretRightIcon } from 'phosphor-react-native';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { localDateKey } from '@/components/books/bookLogDates';
import type { BookReadingLog } from '@/lib/library/types';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type BookLogCalendarGridProps = {
  month: Date;
  logs: BookReadingLog[];
  selectedDate?: string;
  onChangeMonth: (month: Date) => void;
  onPressDate: (date: string) => void;
};

export function BookLogCalendarGrid({
  month,
  logs,
  selectedDate,
  onChangeMonth,
  onPressDate,
}: BookLogCalendarGridProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const gridBleed = containerWidth / 14;
  const byDate = useMemo(() => {
    const result = new Map<string, BookReadingLog[]>();
    for (const log of logs) result.set(log.date, [...(result.get(log.date) ?? []), log]);
    return result;
  }, [logs]);
  const firstWeekday = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from(
    { length: Math.ceil((firstWeekday + days) / 7) * 7 },
    (_, index) => index - firstWeekday + 1
  );

  return (
    <View
      onLayout={(event) => {
        const nextWidth = event.nativeEvent.layout.width;
        setContainerWidth((currentWidth) =>
          currentWidth === nextWidth ? currentWidth : nextWidth
        );
      }}
    >
      <View className="flex-row mb-6" style={{ marginHorizontal: -gridBleed }}>
        <Pressable
          onPress={() => onChangeMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          hitSlop={10}
          className="h-10 items-center justify-center"
          style={{ width: '14.2857%' }}
        >
          <CaretLeftIcon size={18} color="#D4D4D8" />
        </Pressable>
        <View className="items-center justify-center" style={{ width: '71.4286%' }}>
          <Text className="font-sans-semibold text-base text-white">
            {month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </Text>
        </View>

        <Pressable
          onPress={() => onChangeMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          accessibilityRole="button"
          accessibilityLabel="Next month"
          hitSlop={10}
          className="h-10 items-center justify-center"
          style={{ width: '14.2857%' }}
        >
          <CaretRightIcon size={18} color="#D4D4D8" />
        </Pressable>
      </View>

      <View className="flex-row mb-2" style={{ marginHorizontal: -gridBleed }}>
        {WEEKDAYS.map((day, index) => (
          <Text key={index} className="flex-1 text-center font-sans-medium text-xs text-zinc-500">
            {day}
          </Text>
        ))}
      </View>

      <View className="flex-row flex-wrap" style={{ marginHorizontal: -gridBleed }}>
        {cells.map((day, index) => {
          if (day < 1 || day > days)
            return <View key={index} style={{ width: '14.2857%', height: 48 }} />;
          const key = localDateKey(new Date(month.getFullYear(), month.getMonth(), day));
          const dayLogs = byDate.get(key) ?? [];
          const hasNote = dayLogs.some((log) => log.noteId);
          const selected = key === selectedDate;
          return (
            <Pressable
              key={index}
              onPress={() => onPressDate(key)}
              accessibilityRole="button"
              accessibilityLabel={`${month.toLocaleDateString(undefined, { month: 'long' })} ${day}${dayLogs.length ? ', reading logged' : ''}${hasNote ? ', note available' : ''}`}
              style={{ width: '14.2857%', height: 48 }}
              className="items-center justify-center"
            >
              <View
                className={`w-9 h-9 rounded-full items-center justify-center ${selected ? 'bg-amber-400' : dayLogs.length ? 'bg-amber-400/20' : ''}`}
              >
                <Text
                  className={`font-sans-medium text-sm ${selected ? 'text-zinc-950' : dayLogs.length ? 'text-amber-200' : 'text-zinc-400'}`}
                >
                  {day}
                </Text>
              </View>
              {hasNote && <View className="absolute bottom-0 w-1 h-1 rounded-full bg-amber-300" />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
