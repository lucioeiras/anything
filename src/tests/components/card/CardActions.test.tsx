import { fireEvent, render } from '@testing-library/react-native';

import { CardActions } from '@/components/card/CardActions';
import type { LibraryItem } from '@/lib/library/types';

const base = {
  version: 1 as const,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const makeActions = () => ({
  onDelete: jest.fn(),
  onAddToFolder: jest.fn(),
  onDownload: jest.fn(),
  onCopy: jest.fn(),
  onShare: jest.fn(),
  onOpenLink: jest.fn(),
  onOpenPdf: jest.fn(),
});

describe('CardActions', () => {
  it('shows common and text-card actions', async () => {
    const actions = makeActions();
    const item: LibraryItem = { ...base, id: 'note', type: 'note', text: 'Body' };
    const { getByLabelText, queryByLabelText } = await render(
      <CardActions item={item} {...actions} />
    );

    expect(getByLabelText('Delete')).toBeTruthy();
    expect(getByLabelText('Add to folder')).toBeTruthy();
    expect(getByLabelText('Copy')).toBeTruthy();
    expect(queryByLabelText('Share')).toBeNull();
    expect(queryByLabelText('Open link')).toBeNull();
    await fireEvent.press(getByLabelText('Copy'));
    expect(actions.onCopy).toHaveBeenCalledTimes(1);
  });

  it('adds download action for image cards', async () => {
    const actions = makeActions();
    const item: LibraryItem = { ...base, id: 'image', type: 'image', image: 'image.jpg' };
    const { getByLabelText } = await render(<CardActions item={item} {...actions} />);

    await fireEvent.press(getByLabelText('Download image'));
    await fireEvent.press(getByLabelText('Share'));
    expect(actions.onDownload).toHaveBeenCalledTimes(1);
    expect(actions.onShare).toHaveBeenCalledTimes(1);
  });

  it('shows PDF actions and opens the PDF', async () => {
    const actions = makeActions();
    const item: LibraryItem = { ...base, id: 'pdf', type: 'pdf', pdf: 'document.pdf' };
    const { getByLabelText } = await render(<CardActions item={item} {...actions} />);

    await fireEvent.press(getByLabelText('Open PDF'));
    expect(getByLabelText('Copy')).toBeTruthy();
    expect(getByLabelText('Share')).toBeTruthy();
    expect(actions.onOpenPdf).toHaveBeenCalledTimes(1);
  });

  it('shows share and open-link actions for linked cards', async () => {
    const actions = makeActions();
    const item: LibraryItem = {
      ...base,
      id: 'link',
      type: 'link',
      url: 'https://example.com',
      siteTitle: 'Example',
      description: '',
      favicon: '',
    };
    const { getByLabelText, queryByLabelText } = await render(
      <CardActions item={item} {...actions} />
    );

    await fireEvent.press(getByLabelText('Open link'));
    expect(actions.onOpenLink).toHaveBeenCalledTimes(1);
    expect(getByLabelText('Share')).toBeTruthy();
    expect(queryByLabelText('Copy')).toBeNull();
  });
});
