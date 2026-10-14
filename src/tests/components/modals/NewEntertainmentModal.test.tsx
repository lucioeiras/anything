import { fireEvent, render } from '@testing-library/react-native';
import { EntertainmentTabs } from '@/components/modals/NewEntertainmentModal';

jest.mock('@/components/modals/NewBookModal', () => ({ NewBookModal: () => null }));
jest.mock('@/components/modals/NewMusicModal', () => ({ NewMusicModal: () => null }));
jest.mock('@/components/modals/NewMovieModal', () => ({ NewMovieModal: () => null }));
jest.mock('@/components/modals/NewTvShowModal', () => ({ NewTvShowModal: () => null }));
jest.mock('@/components/modals/NewGameModal', () => ({ NewGameModal: () => null }));

describe('EntertainmentTabs', () => {
  it('renders the type picker as a horizontally scrollable list', async () => {
    const { getByTestId } = await render(
      <EntertainmentTabs selectedType="book" onSelect={jest.fn()} />
    );

    expect(getByTestId('entertainment-type-picker').props.horizontal).toBe(true);
  });

  it('reports the selected content type and marks its tab as selected', async () => {
    const onSelect = jest.fn();
    const { getByRole } = await render(
      <EntertainmentTabs selectedType="book" onSelect={onSelect} />
    );

    await fireEvent.press(getByRole('tab', { name: 'Film' }));

    expect(onSelect).toHaveBeenCalledWith('movie');
    expect(getByRole('tab', { name: 'Book' }).props.accessibilityState).toMatchObject({
      selected: true,
    });
  });

  it('offers TV shows as an entertainment type', async () => {
    const onSelect = jest.fn();
    const { getByRole } = await render(
      <EntertainmentTabs selectedType="book" onSelect={onSelect} />
    );
    await fireEvent.press(getByRole('tab', { name: 'TV' }));
    expect(onSelect).toHaveBeenCalledWith('tvshow');
  });
});
