import { fireEvent, render } from '@testing-library/react-native';

import { RestoreToast } from '@/components/menus/RestoreToast';

describe('RestoreToast', () => {
  it('does not render while hidden', async () => {
    const { toJSON } = await render(
      <RestoreToast visible={false} count={1} onRestore={jest.fn()} onDismiss={jest.fn()} />
    );
    expect(toJSON()).toBeNull();
  });

  it.each([
    [1, 'card'],
    [2, 'cards'],
  ] as const)('uses the singular/plural form for %i', async (count, noun) => {
    const { getByText } = await render(
      <RestoreToast visible count={count} onRestore={jest.fn()} onDismiss={jest.fn()} />
    );
    expect(getByText(new RegExp(`You deleted ${count} ${noun}`))).toBeTruthy();
  });

  it('calls restore when the action is pressed', async () => {
    const onRestore = jest.fn();
    const { getByLabelText } = await render(
      <RestoreToast visible count={3} onRestore={onRestore} onDismiss={jest.fn()} />
    );

    await fireEvent.press(getByLabelText('Restore deleted cards'));
    expect(onRestore).toHaveBeenCalledTimes(1);
  });
});
