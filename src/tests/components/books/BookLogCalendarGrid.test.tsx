import { fireEvent, render } from '@testing-library/react-native';

import { BookLogCalendarGrid } from '@/components/books/BookLogCalendarGrid';

describe('BookLogCalendarGrid', () => {
  const month = new Date(2024, 1, 1);
  const emptyProps = {
    month,
    logs: [],
    onChangeMonth: jest.fn(),
    onPressDate: jest.fn(),
  };

  it('shows the month and its days', async () => {
    const { getByText, getByLabelText } = await render(<BookLogCalendarGrid {...emptyProps} />);
    expect(getByText(/February 2024/)).toBeTruthy();
    expect(getByLabelText('February 29')).toBeTruthy();
  });

  it('moves to the previous or next month', async () => {
    const onChangeMonth = jest.fn();
    const { getByLabelText } = await render(
      <BookLogCalendarGrid {...emptyProps} onChangeMonth={onChangeMonth} />
    );

    await fireEvent.press(getByLabelText('Previous month'));
    await fireEvent.press(getByLabelText('Next month'));
    expect(onChangeMonth).toHaveBeenNthCalledWith(1, new Date(2024, 0, 1));
    expect(onChangeMonth).toHaveBeenNthCalledWith(2, new Date(2024, 2, 1));
  });

  it('selects dates and announces logged reading and available notes', async () => {
    const onPressDate = jest.fn();
    const { getByLabelText } = await render(
      <BookLogCalendarGrid
        {...emptyProps}
        logs={[
          { id: 'log-1', date: '2024-02-12', page: 20, createdAt: '2024-02-12T12:00:00Z' },
          {
            id: 'log-2',
            date: '2024-02-12',
            page: 22,
            createdAt: '2024-02-12T13:00:00Z',
            noteId: 'note-1',
          },
        ]}
        selectedDate="2024-02-12"
        onPressDate={onPressDate}
      />
    );

    await fireEvent.press(getByLabelText('February 12, reading logged, note available'));
    expect(onPressDate).toHaveBeenCalledWith('2024-02-12');
  });
});
