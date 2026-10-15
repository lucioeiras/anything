import { I18n } from 'i18n-js';

import { catalogs, type AppLanguage } from './catalog';

const i18n = new I18n(catalogs);
i18n.enableFallback = true;
// Catalog entries are full UI phrases, so punctuation such as periods is literal.
i18n.defaultSeparator = '\u0000';

export function languageFromLocales(
  locales: readonly { languageCode?: string | null }[]
): AppLanguage {
  for (const locale of locales) {
    const language = locale.languageCode?.toLowerCase();
    if (language?.startsWith('pt')) return 'pt';
    if (language?.startsWith('en')) return 'en';
  }
  return 'en';
}

export function setActiveLanguage(language: AppLanguage): void {
  i18n.locale = language;
}

export function getActiveLanguage(): AppLanguage {
  return i18n.locale === 'pt' ? 'pt' : 'en';
}

export function getLocaleForLanguage(language: AppLanguage): string {
  return language === 'pt' ? 'pt-BR' : 'en-US';
}

export function getActiveLocale(): string {
  return getLocaleForLanguage(getActiveLanguage());
}

export function translate(key: string, options?: Record<string, string | number>): string {
  if (!(key in catalogs[getActiveLanguage()])) {
    return key.replace(/%\{([^}]+)\}/g, (_placeholder, name: string) =>
      options?.[name] === undefined ? '' : String(options[name])
    );
  }
  return i18n.t(key, options);
}
