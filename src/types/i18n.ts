export interface Language {
  code: string
  name: string
  flag: string
  dir: 'ltr' | 'rtl'
}

export interface TranslationNamespace {
  common: Record<string, unknown>
  navigation: Record<string, unknown>
  header: Record<string, unknown>
  hero: Record<string, unknown>
  services: Record<string, unknown>
  form: Record<string, unknown>
  location: Record<string, unknown>
  success: Record<string, unknown>
  errors: Record<string, unknown>
  footer: Record<string, unknown>
  meta: Record<string, unknown>
}

export const SUPPORTED_LOCALES = ['en', 'fr', 'ar'] as const
export type SupportedLocale = typeof SUPPORTED_LOCALES[number]

export const DEFAULT_LOCALE: SupportedLocale = 'en'

export const LANGUAGE_CONFIG: Record<SupportedLocale, Language> = {
  en: {
    code: 'en',
    name: 'English',
    flag: '🇺🇸',
    dir: 'ltr'
  },
  fr: {
    code: 'fr',
    name: 'Français',
    flag: '🇫🇷',
    dir: 'ltr'
  },
  ar: {
    code: 'ar',
    name: 'العربية',
    flag: '🇱🇧',
    dir: 'rtl'
  }
}
