import { render } from '@testing-library/react-native';

import { QuoteCard } from '@/components/cards/QuoteCard';

describe('QuoteCard', () => {
  it('decodes quote text and title and omits the linked row when absent', async () => {
    const { getByText, queryByText } = await render(
      <QuoteCard text="It&#39;s a quote &amp; a test" title='A "title"' />
    );

    expect(getByText("It's a quote & a test")).toBeTruthy();
    expect(getByText('A "title"')).toBeTruthy();
    expect(queryByText('Source title')).toBeNull();
  });

  it('shows linked content when provided', async () => {
    const { getByText } = await render(<QuoteCard text="A quote" linkedTitle="Source title" />);
    expect(getByText('Source title')).toBeTruthy();
  });
});
