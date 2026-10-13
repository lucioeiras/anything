import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AddActionIconSlot } from '@/components/AddActionIconSlot';

describe('AddActionIconSlot', () => {
  it('keeps its content centered inside the 24px icon footprint', async () => {
    const { getByText, getByTestId } = await render(
      <AddActionIconSlot testID="icon-slot">
        <Text>icon</Text>
      </AddActionIconSlot>
    );

    expect(getByText('icon')).toBeTruthy();
    expect(getByTestId('icon-slot').props.style[0]).toEqual({
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
    });
  });
});
