import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { MusicCard } from '@/components/cards/MusicCard';

describe('MusicCard', () => {
  it('uses the full showcase width without side insets', async () => {
    const { getByTestId } = await render(
      <MusicCard title="Album" artist="Artist" cover="cover.jpg" hideTitleAndAuthor />
    );

    const showcaseStyle = getByTestId('music-showcase-container').props.style;
    const sleeveStyle = getByTestId('music-album-sleeve').props.style[1];
    const vinylStyle = getByTestId('music-vinyl-wrapper').props.style[1];

    expect(showcaseStyle[0]).toMatchObject({ width: '100%', overflow: 'visible' });
    expect(sleeveStyle.left).toBe(0);
    expect(vinylStyle.left).toBeGreaterThan(0);
  });

  it('uses a restrained shadow on regular board cards', async () => {
    const { getByTestId } = await render(
      <MusicCard title="Album" artist="Artist" cover="cover.jpg" subtleVinylShadow />
    );

    expect(StyleSheet.flatten(getByTestId('vinyl-record').props.style)).toMatchObject({
      shadowColor: '#71717a',
      shadowOpacity: 0.55,
      shadowRadius: 4,
    });
  });

  it('keeps the original shadow when no board highlight is requested', async () => {
    const { getByTestId } = await render(
      <MusicCard title="Album" artist="Artist" cover="cover.jpg" />
    );

    expect(StyleSheet.flatten(getByTestId('vinyl-record').props.style)).toMatchObject({
      shadowColor: '#000000',
      shadowOpacity: 0.5,
      shadowRadius: 8,
    });
  });
});
