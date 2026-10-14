import { fireEvent, render } from '@testing-library/react-native';

import { TvShowSeasons } from '@/components/card/TvShowSeasons';

describe('TvShowSeasons', () => {
  it('cycles each season status and only enables its review when watched', async () => {
    jest.useFakeTimers();
    const onChange = jest.fn();
    const { getByLabelText, getByText, queryByText } = await render(
      <TvShowSeasons
        seasons={[
          {
            seasonNumber: 1,
            name: 'Season 1',
            poster: 'https://example.com/season-1.jpg',
            progressStatus: 'want',
          },
        ]}
        onChange={onChange}
      />
    );
    expect(getByLabelText('Season 1 poster')).toBeTruthy();
    expect(queryByText('My review')).toBeNull();
    await fireEvent.press(getByLabelText('Want to watch for Season 1. Tap to change status'));
    expect(getByText('Watching')).toBeTruthy();
    await fireEvent.press(getByLabelText('Watching for Season 1. Tap to change status'));
    expect(queryByText('My review')).toBeNull();
    expect(getByLabelText('0.5 out of 5 stars')).toBeTruthy();
    await fireEvent.press(getByLabelText('Watched for Season 1. Tap to change status'));
    expect(queryByText('My review')).toBeNull();
    jest.runOnlyPendingTimers();
    expect(onChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ seasonNumber: 1, progressStatus: 'abandoned' }),
    ]);
    jest.useRealTimers();
  });
});
