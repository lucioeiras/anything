import { fireEvent, render } from '@testing-library/react-native';

import { CardReview } from '@/components/card/CardReview';

describe('CardReview', () => {
  it('renders empty comments and updates rating and comments', async () => {
    const onRatingChange = jest.fn();
    const onCommentsChange = jest.fn();
    const { getByLabelText, getByPlaceholderText } = await render(
      <CardReview
        rating={null}
        comments=""
        onRatingChange={onRatingChange}
        onCommentsChange={onCommentsChange}
      />
    );

    await fireEvent.press(getByLabelText('3.5 out of 5 stars'));
    await fireEvent.changeText(getByPlaceholderText('What is your opinion on this?'), 'Great');
    expect(onRatingChange).toHaveBeenCalledWith(3.5);
    expect(onCommentsChange).toHaveBeenCalledWith('Great');
  });

  it('reflects a selected full-star rating', async () => {
    const { getByLabelText } = await render(
      <CardReview
        rating={4}
        comments="Worth reading"
        onRatingChange={jest.fn()}
        onCommentsChange={jest.fn()}
      />
    );

    expect(getByLabelText('4 out of 5 stars').props.accessibilityState.selected).toBe(true);
    expect(getByLabelText('3.5 out of 5 stars').props.accessibilityState.selected).toBe(false);
  });
});
