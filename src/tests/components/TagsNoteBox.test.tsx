import { fireEvent, render } from '@testing-library/react-native';

import { TagsNoteBox } from '@/components/TagsNoteBox';

describe('TagsNoteBox', () => {
  it('adds normalized tags when a delimiter is entered', async () => {
    const onTagsChange = jest.fn();
    const onTagInputChange = jest.fn();
    const { getByPlaceholderText } = await render(
      <TagsNoteBox
        tags={['existing']}
        onTagsChange={onTagsChange}
        tagInput="#new,"
        onTagInputChange={onTagInputChange}
        note=""
        onNoteChange={jest.fn()}
        activeTab="tags"
        onActiveTabChange={jest.fn()}
      />
    );

    await fireEvent.changeText(getByPlaceholderText('+ Add more'), '#new,');
    expect(onTagsChange).toHaveBeenCalledTimes(1);
    expect(onTagsChange.mock.calls[0][0](['existing'])).toEqual(['existing', 'new']);
    expect(onTagInputChange).toHaveBeenCalledWith('');
  });

  it('removes a tag and changes between tag and note tabs', async () => {
    const onTagsChange = jest.fn();
    const onActiveTabChange = jest.fn();
    const { getByText } = await render(
      <TagsNoteBox
        tags={['travel']}
        onTagsChange={onTagsChange}
        tagInput=""
        onTagInputChange={jest.fn()}
        note="Some note"
        onNoteChange={jest.fn()}
        activeTab="tags"
        onActiveTabChange={onActiveTabChange}
      />
    );

    await fireEvent.press(getByText('#travel'));
    expect(onTagsChange.mock.calls[0][0](['travel', 'books'])).toEqual(['books']);
    await fireEvent.press(getByText('NOTE •'));
    expect(onActiveTabChange).toHaveBeenCalledWith('note');
  });
});
