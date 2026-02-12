'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Globe, ChevronDown } from 'lucide-react'
import { LANGUAGE_CONFIG, SupportedLocale } from '@/types/i18n'

export default function LanguageSelector() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const locale = pathname.startsWith('/ar') ? 'ar' : pathname.startsWith('/fr') ? 'fr' : 'en' as SupportedLocale

  const handleLanguageChange = (newLocale: SupportedLocale) => {
    const pathnameWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '')
    const newPathname = `/${newLocale}${pathnameWithoutLocale}`
    router.push(newPathname)
    setIsOpen(false)
  }

  const currentLanguage = LANGUAGE_CONFIG[locale]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-100 hover:text-white hover:bg-blue-800/30 rounded-lg transition-all duration-200"
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{currentLanguage.flag}</span>
        <span className="hidden md:inline">{currentLanguage.name}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute ${locale === 'ar' ? 'left-0' : 'right-0'} mt-2 w-48 bg-gray-900 text-white rounded-lg shadow-xl border border-gray-700 py-1 z-[100]`}>
          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Language
          </div>
          {Object.values(LANGUAGE_CONFIG).map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code as SupportedLocale)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-800 transition-colors ${
                locale === language.code ? 'bg-blue-900 text-white font-medium' : 'text-white'
              }`}
              role="option"
              aria-selected={locale === language.code}
            >
              <span className="text-lg">{language.flag}</span>
              <span>{language.name}</span>
              {locale === language.code && (
                <svg className="w-4 h-4 ml-auto text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
