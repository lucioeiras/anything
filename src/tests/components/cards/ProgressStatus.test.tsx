import { render } from '@testing-library/react-native';

import { getProgressLabel, ProgressStatus } from '@/components/cards/ProgressStatus';
import type { MediaProgressStatus } from '@/lib/library/types';

describe('ProgressStatus', () => {
  const cases: [MediaProgressStatus, string][] = [
    ['want', 'Want to read'],
    ['in-progress', 'Reading'],
    ['completed', 'Read'],
    ['abandoned', 'Abandoned'],
  ];

  it.each(cases)('shows the %s label for books', async (status, label) => {
    expect(getProgressLabel('book', status)).toBe(label);
    expect(
      (await render(<ProgressStatus type="book" status={status} />)).getByText(label)
    ).toBeTruthy();
  });

  it('uses media specific labels', () => {
    expect(getProgressLabel('movie', 'completed')).toBe('Watched');
    expect(getProgressLabel('game', 'in-progress')).toBe('Playing');
    expect(getProgressLabel('youtube', 'want')).toBe('Want to watch');
  });

  it.each(['article', 'youtube'] as const)(
    'maps unsupported abandoned status for %s to want',
    async (type) => {
      const { getByText, queryByText } = await render(
        <ProgressStatus type={type} status="abandoned" />
      );

      expect(getByText(type === 'youtube' ? 'Want to watch' : 'Want to read')).toBeTruthy();
      expect(queryByText('Abandoned')).toBeNull();
    }
  );
});
