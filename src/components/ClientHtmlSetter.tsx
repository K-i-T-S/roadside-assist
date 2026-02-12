'use client'

import { useEffect } from 'react'

interface ClientHtmlSetterProps {
  locale: string
  isRTL: boolean
}

export default function ClientHtmlSetter({ locale, isRTL }: ClientHtmlSetterProps) {
  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
    document.documentElement.className = `scroll-smooth ${isRTL ? 'rtl' : 'ltr'}`
  }, [locale, isRTL])

  return null
}
