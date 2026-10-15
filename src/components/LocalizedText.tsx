import { Text, type TextProps } from 'react-native';

import { useLocalization } from '@/lib/i18n';

/** Renders app-authored text through the active language catalog. */
export function LocalizedText({ children, ...props }: TextProps) {
  const { t } = useLocalization();
  const content = typeof children === 'string' ? t(children) : children;
  return <Text {...props}>{content}</Text>;
}
