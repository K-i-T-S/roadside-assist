'use client'

import { useEffect } from 'react'
import { structuredDataString, breadcrumbStructuredDataString, websiteStructuredDataString } from '../app/structured-data'

export default function StructuredDataScripts() {
  useEffect(() => {
    // Only inject scripts on client side to prevent hydration mismatches
    const injectScript = (content: string) => {
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.textContent = content
      document.head.appendChild(script)
    }

    injectScript(structuredDataString)
    injectScript(breadcrumbStructuredDataString)
    injectScript(websiteStructuredDataString)

    return () => {
      // Cleanup on unmount
      const scripts = document.head.querySelectorAll('script[type="application/ld+json"]')
      scripts.forEach(script => script.remove())
    }
  }, [])

  return null // Render nothing on server
}
