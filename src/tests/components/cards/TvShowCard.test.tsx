import { render } from '@testing-library/react-native';

import { TvShowCard } from '@/components/cards/TvShowCard';

describe('TvShowCard', () => {
  it('shows only the CRT poster, title, and general progress status', async () => {
    const { getByText, queryByText, getByLabelText } = await render(
      <TvShowCard
        title="Example show"
        poster="poster.jpg"
        progressStatus="in-progress"
        onAspectRatioChange={jest.fn()}
      />
    );

    expect(getByText('Example show')).toBeTruthy();
    expect(getByText('Watching')).toBeTruthy();
    expect(getByLabelText('Example show poster').props.style).toMatchObject({ width: '100%' });
    expect(queryByText('seasons')).toBeNull();
    expect(queryByText('2020')).toBeNull();
  });

  it('hides the title and status when requested', async () => {
    const { queryByText } = await render(
      <TvShowCard title="Example show" poster="poster.jpg" hideTitleAndAuthor />
    );

    expect(queryByText('Example show')).toBeNull();
    expect(queryByText('Want to watch')).toBeNull();
  });
});
