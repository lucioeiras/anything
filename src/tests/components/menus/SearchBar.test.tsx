import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { Text } from 'react-native';

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

  it('floats above the board content', async () => {
    const { toJSON } = await render(<SearchBar value="" onChangeText={jest.fn()} />);
    expect(StyleSheet.flatten(toJSON()?.props.style)).toMatchObject({
      position: 'absolute',
      right: 0,
      bottom: 0,
      left: 0,
      zIndex: 1000,
    });
  });

  it('can clear the tab bar using a bottom offset', async () => {
    const { toJSON } = await render(
      <SearchBar value="" onChangeText={jest.fn()} bottomOffset={72} />
    );
    expect(StyleSheet.flatten(toJSON()?.props.style)).toMatchObject({ bottom: 72 });
  });

  it('renders a trailing primary action beside the search field', async () => {
    const { getByText } = await render(
      <SearchBar value="" onChangeText={jest.fn()} trailingAction={<Text>Add action</Text>} />
    );
    expect(getByText('Add action')).toBeTruthy();
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
