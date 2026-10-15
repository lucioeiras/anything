import { Button } from '@/components/Button';
import { ActivityCalendar } from '@/components/profile/ActivityCalendar';
import { CompletionChart } from '@/components/profile/CompletionChart';
import { CompletionTypeFilters } from '@/components/profile/CompletionTypeFilters';
import { ProfileSelect } from '@/components/profile/ProfileSelect';
import { ReadingCalendarSection } from '@/components/profile/ReadingCalendarSection';
import { useLibrary } from '@/hooks/useLibrary';
import {
  getLibraryActivity,
  getMonthlyCompletions,
  type TrackableType,
} from '@/lib/library/activity';
import { router } from 'expo-router';
import { NutIcon } from 'phosphor-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LocalizedText } from '@/components/LocalizedText';
import { translate, useLocalization } from '@/lib/i18n';

export default function ProfileScreen() {
  const { language } = useLocalization();
  const locale = language === 'pt' ? 'pt-BR' : 'en-US';
  const { state, currentFolderName, setSearchQuery, clearSearchTag, refresh } = useLibrary();
  const currentYear = new Date().getFullYear();
  const [month, setMonth] = useState(() => new Date(currentYear, new Date().getMonth(), 1));
  const [selectedYear, setYear] = useState(currentYear);
  const [type, setType] = useState<TrackableType | null>(null);
  const items = useMemo(() => (state.status === 'ready' ? state.result.items : []), [state]);
  const activity = useMemo(() => getLibraryActivity(items, currentYear), [items, currentYear]);
  const year = activity.years.includes(selectedYear) ? selectedYear : currentYear;
  const completions = useMemo(() => getMonthlyCompletions(items, year, type), [items, year, type]);
  const openDay = (day: string) => {
    setSearchQuery('');
    clearSearchTag();
    router.navigate({
      pathname: '/board',
      params: { addedOn: day, activityToken: String(Date.now()), folderKind: '', folderKey: '' },
    });
  };
  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top', 'left', 'right']}>
      <ScrollView contentContainerClassName="pt-5 pb-40" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between gap-4 px-8 pb-8">
          <View className="flex-1 flex-row gap-3 items-center">
            <Text className="font-sans-semibold text-2xl text-white">
              <LocalizedText>Profile</LocalizedText>
            </Text>
            <Text className="font-sans text-base text-zinc-400 leading-tight">
              {currentFolderName}
            </Text>
          </View>
          <Button
            accessibilityLabel={translate('Settings')}
            size="small"
            icon={<NutIcon size={20} color="#FFFFFF" />}
            onPress={() => router.push('/settings')}
          />
        </View>
        {state.status === 'loading' && (
          <ActivityIndicator accessibilityLabel={translate('Loading profile')} color="#71717A" />
        )}
        {state.status === 'error' && (
          <View className="gap-4 px-8">
            <Text className="font-sans text-base text-zinc-400">
              <LocalizedText>Could not load your library.</LocalizedText>
            </Text>
            <Button
              accessibilityLabel={translate('Retry loading library')}
              text={translate('Try again')}
              onPress={() => void refresh()}
            />
          </View>
        )}

        {state.status === 'ready' && (
          <>
            <View className="flex-row flex-wrap border-y border-zinc-800 px-8 py-6">
              <Stat label={translate('Saved cards')} value={String(activity.total)} />
              <Stat label={translate('Completed')} value={String(activity.completed)} />
              <Stat
                label={translate('First card saved')}
                value={activity.firstSaved?.toLocaleDateString(locale) ?? '—'}
              />
              <Stat label={translate('Days with additions')} value={String(activity.activeDays)} />
            </View>

            {activity.total === 0 && (
              <Text className="px-8 pt-6 font-sans text-base text-zinc-400">
                <LocalizedText>Save your first card to start your library activity.</LocalizedText>
              </Text>
            )}

            <View className="border-t border-zinc-800 px-8 py-6">
              <Text className="mb-2 font-sans-semibold text-sm uppercase tracking-wider text-zinc-200">
                <LocalizedText>Added cards</LocalizedText>
              </Text>
              <Text className="mb-4 font-sans text-sm text-zinc-500">
                <LocalizedText>Tap a day to see the cards you saved.</LocalizedText>
              </Text>
              <ActivityCalendar
                month={month}
                byDay={activity.byDay}
                onChangeMonth={setMonth}
                onPressDate={openDay}
              />
            </View>

            <View className="border-t border-zinc-800 py-6" style={{ zIndex: 1 }}>
              <Text className="mb-4 px-8 font-sans-semibold text-sm uppercase tracking-wider text-zinc-200">
                <LocalizedText>Completed cards</LocalizedText>
              </Text>
              <View className="flex-row items-center gap-2 pl-8" style={{ zIndex: 1 }}>
                <ProfileSelect
                  label={translate('Year')}
                  value={String(year)}
                  options={activity.years.map((y) => ({ value: String(y), label: String(y) }))}
                  onSelect={(value) => setYear(Number(value))}
                />
                <CompletionTypeFilters selectedType={type} onSelect={setType} />
              </View>
              <View className="px-8">
                <CompletionChart months={completions.months} year={year} />
                {completions.undated > 0 && (
                  <Text className="mt-4 font-sans text-sm leading-relaxed text-zinc-500">
                    {completions.undated}{' '}
                    <LocalizedText>
                      completed card(s) have no completion date and are not included in this chart.
                    </LocalizedText>
                  </Text>
                )}
              </View>
            </View>
            <ReadingCalendarSection items={items} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="w-1/2 gap-2 py-3 pr-3">
      <Text className="font-sans text-xs text-zinc-500">{label}</Text>
      <Text className="font-sans-semibold text-xl text-white">{value}</Text>
    </View>
  );
}
