import { render } from '@testing-library/react-native';

import { NoteCard } from '@/components/cards/NoteCard';

describe('NoteCard', () => {
  it('renders Markdown instead of showing the source syntax', async () => {
    const { getByText, queryByRole, queryByText } = await render(
      <NoteCard text={'## Section\n\n**Important** detail'} />
    );

    expect(getByText('Section')).toBeTruthy();
    expect(getByText('Important')).toBeTruthy();
    expect(queryByText('## Section')).toBeNull();
    expect(queryByRole('button')).toBeNull();
  });
});
