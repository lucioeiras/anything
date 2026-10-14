import { render } from '@testing-library/react-native';

import { TagsBox } from '@/components/TagsBox';

describe('TagsBox', () => {
  it('renders saved folder tags with the folder identity', async () => {
    const { getByLabelText } = await render(
      <TagsBox tags={['Reading']} folderTags={['Reading']} editable={false} />
    );

    expect(getByLabelText('Folder Reading')).toBeTruthy();
    expect(() => getByLabelText('Tag Reading')).toThrow();
  });
});
