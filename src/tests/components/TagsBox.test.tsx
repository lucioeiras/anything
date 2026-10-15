import { render } from '@testing-library/react-native';

import { TagsBox } from '@/components/TagsBox';
import { setActiveLanguage } from '@/lib/i18n/locale';

describe('TagsBox', () => {
  it('renders saved folder tags with the folder identity', async () => {
    const { getByLabelText } = await render(
      <TagsBox tags={['Reading']} folderTags={['Reading']} editable={false} />
    );

    expect(getByLabelText('Folder Reading')).toBeTruthy();
    expect(() => getByLabelText('Tag Reading')).toThrow();
  });

  it('localizes its empty and additional tag placeholders', async () => {
    setActiveLanguage('pt');
    const { getByPlaceholderText, rerender } = await render(<TagsBox tags={[]} />);
    expect(getByPlaceholderText('Adicione tags aqui...')).toBeTruthy();
    await rerender(<TagsBox tags={['Leitura']} />);
    expect(getByPlaceholderText('+ Adicionar mais')).toBeTruthy();
    setActiveLanguage('en');
  });
});
