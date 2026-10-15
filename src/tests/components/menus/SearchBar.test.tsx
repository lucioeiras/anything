import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { Text } from 'react-native';

import { SearchBar } from '@/components/menus/SearchBar';
import { setActiveLanguage } from '@/lib/i18n/locale';

describe('SearchBar', () => {
  it('renders the default placeholder and forwards typed text', async () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = await render(
      <SearchBar value="" onChangeText={onChangeText} />
    );

    const input = getByPlaceholderText('Search cards, tags, notes...');
    expect(input.props.className).toContain('min-w-0');
    expect(input.props.className).toContain('flex-1');
    expect(input.props.multiline).toBe(false);
    expect(input.props.scrollEnabled).toBe(true);
    await fireEvent.changeText(input, 'design');
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
    expect(getByPlaceholderText('Search within...').parent?.props.className).toContain(
      'flex-nowrap'
    );
    await fireEvent.press(getByLabelText('Remove tag filter travel'));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('localizes both the default and scoped placeholders', async () => {
    setActiveLanguage('pt');
    const { getByPlaceholderText, rerender } = await render(
      <SearchBar value="" onChangeText={jest.fn()} />
    );
    expect(getByPlaceholderText('Buscar cartões, tags e notas...')).toBeTruthy();
    await rerender(
      <SearchBar
        value=""
        onChangeText={jest.fn()}
        filters={[{ kind: 'tag', label: 'trabalho', onRemove: jest.fn() }]}
      />
    );
    expect(getByPlaceholderText('Buscar aqui dentro...')).toBeTruthy();
    setActiveLanguage('en');
  });
});

it('shows and removes a date filter independently of other filters', async () => {
  const removeDate = jest.fn(),
    removeTag = jest.fn();
  const { getByLabelText } = await render(
    <SearchBar
      value=""
      onChangeText={jest.fn()}
      filters={[
        { kind: 'date', label: '10/13/2026', onRemove: removeDate },
        { kind: 'tag', label: 'reading', onRemove: removeTag },
      ]}
    />
  );
  expect(getByLabelText('Remove date filter 10/13/2026').props.className).toContain(
    'bg-amber-500/15'
  );
  await fireEvent.press(getByLabelText('Remove date filter 10/13/2026'));
  expect(removeDate).toHaveBeenCalledTimes(1);
  expect(removeTag).not.toHaveBeenCalled();
});
