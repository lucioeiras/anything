import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { ActionFooter } from '@/components/ActionFooter';
import { Button } from '@/components/Button';

describe('ActionFooter', () => {
  it('renders its actions and forwards presses', async () => {
    const onPress = jest.fn();
    const { getByRole, getByText } = await render(
      <ActionFooter>
        <Button accessibilityLabel="Save" text="Save" onPress={onPress} variant="primary" />
      </ActionFooter>
    );

    expect(getByText('Save')).toBeTruthy();
    await fireEvent.press(getByRole('button', { name: 'Save' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('supports icon-only and text-only actions', async () => {
    const { getByLabelText, getByText, queryByText } = await render(
      <ActionFooter>
        <Button accessibilityLabel="Delete" icon={<Text>Icon</Text>} onPress={jest.fn()} />
        <Button accessibilityLabel="Cancel" text="Cancel" onPress={jest.fn()} />
      </ActionFooter>
    );

    expect(getByLabelText('Delete')).toBeTruthy();
    expect(getByText('Icon')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();
    expect(queryByText('Delete')).toBeNull();
  });

  it('can float over scrollable content', async () => {
    const { toJSON } = await render(
      <ActionFooter overlay>
        <Button accessibilityLabel="Save" text="Save" onPress={jest.fn()} />
      </ActionFooter>
    );

    expect(toJSON()?.props.style).toMatchObject({ position: 'absolute', bottom: 0 });
  });
});
