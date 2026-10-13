import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';

describe('Button', () => {
  it('uses the content color for its icon', async () => {
    const TestIcon = ({ color, size }: { color?: string; size?: number }) => (
      <View testID="button-icon" accessibilityLabel={`${color}-${size}`} />
    );
    const { getByTestId } = await render(
      <Button
        accessibilityLabel="Selected tab"
        icon={<TestIcon color="#FFFFFF" size={24} />}
        contentColor="#000000"
        onPress={jest.fn()}
        size="small"
      />
    );

    expect(getByTestId('button-icon').props.accessibilityLabel).toBe('#000000-20');
  });

  it('renders the small text button dimensions and typography', async () => {
    const { getByRole, getByText } = await render(
      <Button
        accessibilityLabel="Continue"
        size="small"
        text="Continue"
        icon={<Text>Icon</Text>}
        onPress={jest.fn()}
      />
    );

    expect(getByRole('button', { name: 'Continue' }).props.className).toContain('px-4 py-2');
    expect(getByText('Continue').props.className).toContain('text-sm');
  });

  it('keeps the existing dimensions when size is omitted', async () => {
    const { getByRole, getByText } = await render(
      <Button accessibilityLabel="Save" text="Save" onPress={jest.fn()} />
    );

    expect(getByRole('button', { name: 'Save' }).props.className).toContain('px-6 py-3');
    expect(getByText('Save').props.className).toContain('text-lg');
  });
});
