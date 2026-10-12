import { fireEvent, render } from '@testing-library/react-native';

import { SearchBar } from '@/components/menus/SearchBar';

describe('SearchBar', () => {
  it('renders the default placeholder and forwards typed text', async () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = await render(
      <SearchBar value="" onChangeText={onChangeText} />
    );

    await fireEvent.changeText(getByPlaceholderText('Search cards, tags, notes...'), 'design');
    expect(onChangeText).toHaveBeenCalledWith('design');
  });

  it('hides when visible is false', async () => {
    const { toJSON } = await render(
      <SearchBar value="" onChangeText={jest.fn()} visible={false} />
    );
    expect(toJSON()).toBeNull();
  });

  it('clears the query', async () => {
    const onChangeText = jest.fn();
    const { getByLabelText } = await render(
      <SearchBar value="hello" onChangeText={onChangeText} />
    );
    await fireEvent.press(getByLabelText('Clear search'));

    expect(onChangeText).toHaveBeenCalledWith('');
  });

  it('shows scoped placeholder and removes active filters', async () => {
    const onRemove = jest.fn();
    const { getByPlaceholderText, getByLabelText } = await render(
      <SearchBar
        value=""
        onChangeText={jest.fn()}
        filters={[{ kind: 'tag', label: 'travel', onRemove }]}
      />
    );

    expect(getByPlaceholderText('Search within...')).toBeTruthy();
    await fireEvent.press(getByLabelText('Remove tag filter travel'));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
