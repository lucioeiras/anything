import { localDayKey } from '@/lib/library/activity';
import { CaretLeftIcon, CaretRightIcon } from 'phosphor-react-native';
import { Pressable, Text, View } from 'react-native';

type Props = {
  month: Date;
  byDay: Record<string, number>;
  onChangeMonth: (month: Date) => void;
  onPressDate: (day: string) => void;
};

export function ActivityCalendar({ month, byDay, onChangeMonth, onPressDate }: Props) {
  const firstWeekday = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from(
    { length: Math.ceil((firstWeekday + days) / 7) * 7 },
    (_, i) => i - firstWeekday + 1
  );
  const today = localDayKey(new Date());
  return (
    <View>
      <View className="mb-4 flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          className="h-12 w-12 items-start justify-center"
          onPress={() => onChangeMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
        >
          <CaretLeftIcon size={18} color="#D4D4D8" />
        </Pressable>
        <Text className="font-sans-semibold text-base text-white">
          {month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          className="h-12 w-12 items-end justify-center"
          onPress={() => onChangeMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
        >
          <CaretRightIcon size={18} color="#D4D4D8" />
        </Pressable>
      </View>
      <View className="mb-2 flex-row">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <Text key={i} className="flex-1 text-center font-sans-medium text-xs text-zinc-500">
            {day}
          </Text>
        ))}
      </View>
      <View className="flex-row flex-wrap">
        {cells.map((day, i) => {
          if (day < 1 || day > days)
            return <View key={i} style={{ width: '14.2857%', height: 64 }} />;
          const date = new Date(month.getFullYear(), month.getMonth(), day);
          const key = localDayKey(date);
          const count = byDay[key] ?? 0;
          // Keep the scale consistent across months: one card is dark blue,
          // and ten or more reach the lightest shade.
          const intensity = Math.min(1, Math.max(0, (count - 1) / 9));
          const backgroundColor =
            count > 0
              ? `rgb(${Math.round(30 + 117 * intensity)}, ${Math.round(58 + 139 * intensity)}, ${Math.round(138 + 115 * intensity)})`
              : '#18181B';
          return (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={`${date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}, ${count} cards added`}
              onPress={() => onPressDate(key)}
              style={{ width: '14.2857%', height: 64, padding: 2 }}
            >
              <View
                testID={`activity-day-${key}`}
                style={{ backgroundColor }}
                className={`flex-1 overflow-hidden rounded-xl p-1.5 ${key === today ? 'border border-white' : ''}`}
              >
                <Text
                  className={`font-sans-medium text-xs ${count >= 5 ? 'text-zinc-950' : count > 0 ? 'text-white' : 'text-zinc-500'}`}
                >
                  {day}
                </Text>
                {count > 0 && (
                  <Text
                    testID={`activity-day-count-${key}`}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.65}
                    className={`absolute bottom-1.5 left-1.5 right-1.5 text-right font-sans-bold text-base ${count >= 5 ? 'text-zinc-950' : count > 0 ? 'text-white' : 'text-zinc-500'}`}
                  >
                    {count}
                  </Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
