import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { ReadingCalendarSection } from '@/components/profile/ReadingCalendarSection';
import type { BookItem } from '@/lib/library/types';
import { setActiveLanguage } from '@/lib/i18n/locale';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/components/Button', () => ({
  Button: ({
    accessibilityLabel,
    onPress,
  }: {
    accessibilityLabel: string;
    onPress: () => void;
  }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pressable, Text } = require('react-native');
    return (
      <Pressable accessibilityLabel={accessibilityLabel} onPress={onPress}>
        <Text>{accessibilityLabel}</Text>
      </Pressable>
    );
  },
}));
function book(id: string, dates: string[]): BookItem {
  return {
    id,
    type: 'book',
    version: 1,
    title: `Book ${id}`,
    authors: ['Author'],
    isbn: id,
    cover: `file:///cover-${id}.jpg`,
    createdAt: '',
    updatedAt: '',
    readingLogs: dates.map((date) => ({
      id: date,
      date,
      page: 10,
      createdAt: '2026-10-13T12:00:00Z',
    })),
  };
}
beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers().setSystemTime(new Date(2026, 9, 13, 12));
  setActiveLanguage('en');
});
afterEach(() => {
  setActiveLanguage('en');
  jest.useRealTimers();
});
it('shows the annual best streak and stacked covers on days with multiple books', async () => {
  const a = book('a', ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-13']);
  const b = book('b', ['2026-10-13', '2026-10-13']);
  await render(<ReadingCalendarSection items={[a, b]} />);
  expect(screen.getByLabelText('Best reading streak in 2026: 3 days')).toBeTruthy();
  expect(
    screen.getByLabelText(/October 2, 2026, 1 books logged, best reading streak, Book a/)
  ).toBeTruthy();
  expect(
    screen.getByTestId('reading-stack-2026-10-13-a', { includeHiddenElements: true })
  ).toBeTruthy();
  expect(
    screen.getByTestId('reading-stack-2026-10-13-b', { includeHiddenElements: true })
  ).toBeTruthy();
  expect(screen.getByTestId('reading-day-2026-10-02').props.style.backgroundColor).not.toEqual(
    screen.getByTestId('reading-day-2026-10-13').props.style.backgroundColor
  );
  await fireEvent.press(screen.getByLabelText(/October 13, 2026, 2 books logged/));
  await fireEvent.press(screen.getByLabelText('Open reading book Book b'));
  expect(router.push).toHaveBeenCalledWith({ pathname: '/card/[id]', params: { id: 'b' } });
  expect(screen.queryByLabelText('Close reading books')).toBeNull();
});
it('opens a single logged book directly and does not open empty days', async () => {
  await render(<ReadingCalendarSection items={[book('a', ['2026-10-01'])]} />);
  await fireEvent.press(screen.getByLabelText(/October 1, 2026, 1 books logged/));
  expect(router.push).toHaveBeenCalledWith({ pathname: '/card/[id]', params: { id: 'a' } });
  jest.clearAllMocks();
  await fireEvent.press(screen.getByLabelText(/October 2, 2026, 0 books logged/));
  expect(router.push).not.toHaveBeenCalled();
});
it('limits the cover stack while keeping all books available in the day list', async () => {
  await render(
    <ReadingCalendarSection items={['a', 'b', 'c', 'd'].map((id) => book(id, ['2026-10-13']))} />
  );
  expect(screen.getByText('+1', { includeHiddenElements: true })).toBeTruthy();
  expect(
    screen.queryByTestId('reading-stack-2026-10-13-d', { includeHiddenElements: true })
  ).toBeNull();
  await fireEvent.press(screen.getByLabelText(/October 13, 2026, 4 books logged/));
  expect(screen.getByLabelText('Open reading book Book d')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Close reading books'));
  expect(screen.queryByLabelText('Open reading book Book d')).toBeNull();
});
it('navigates months and recalculates the best streak for the displayed year', async () => {
  await render(
    <ReadingCalendarSection
      items={[book('a', ['2026-10-01']), book('b', ['2025-12-30', '2025-12-31'])]}
    />
  );
  for (let i = 0; i < 10; i++)
    await fireEvent.press(screen.getByLabelText('Previous reading month'));
  expect(screen.getByText('December 2025')).toBeTruthy();
  expect(screen.getByLabelText('Best reading streak in 2025: 2 days')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Next reading month'));
  expect(screen.getByText('January 2026')).toBeTruthy();
});
it('shows an empty state and refreshes when the library changes', async () => {
  const view = await render(<ReadingCalendarSection items={[]} />);
  expect(screen.getByText('No reading logs recorded for 2026.')).toBeTruthy();
  await view.rerender(<ReadingCalendarSection items={[book('a', ['2026-10-13'])]} />);
  expect(screen.getByLabelText('Best reading streak in 2026: 1 day')).toBeTruthy();
  expect(screen.queryByText('No reading logs recorded for 2026.')).toBeNull();
});
it('localizes the streak heading and day count in Portuguese, including singular', async () => {
  setActiveLanguage('pt');
  const { rerender } = await render(
    <ReadingCalendarSection items={[book('a', ['2026-10-01', '2026-10-02'])]} />
  );
  expect(screen.getByText('Maior sequência de leitura em 2026')).toBeTruthy();
  expect(screen.getByText('2 dias')).toBeTruthy();
  expect(screen.getAllByText(/^[STQD]$/).map((element) => element.props.children)).toEqual([
    'S',
    'T',
    'Q',
    'Q',
    'S',
    'S',
    'D',
  ]);
  expect(screen.getByLabelText('Maior sequência de leitura em 2026: 2 dias')).toBeTruthy();

  await rerender(<ReadingCalendarSection items={[book('a', ['2026-10-01'])]} />);
  expect(screen.getByText('1 dia')).toBeTruthy();
  expect(screen.getByLabelText('Maior sequência de leitura em 2026: 1 dia')).toBeTruthy();
});
