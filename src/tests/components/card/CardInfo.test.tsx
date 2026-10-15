import { render, screen } from '@testing-library/react-native';

import { CardInfo } from '@/components/card/CardInfo';
import type { NoteItem } from '@/lib/library/types';
import { setActiveLanguage } from '@/lib/i18n/locale';

const item: NoteItem = {
  id: 'note-1',
  version: 1,
  type: 'note',
  text: 'A note',
  createdAt: '2026-01-05T12:00:00.000Z',
  updatedAt: '2026-01-05T12:00:00.000Z',
};

it('localizes the added date label and date format in Portuguese', async () => {
  setActiveLanguage('pt');
  await render(<CardInfo item={item} />);
  expect(screen.getByText(/Adicionado em/)).toBeTruthy();
  expect(screen.getByText(/5 de jan\./)).toBeTruthy();
  setActiveLanguage('en');
});
