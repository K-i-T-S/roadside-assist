export const structuredData = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "KiTS Roadside Assistance",
  "description": "24/7 roadside assistance service across Lebanon providing towing, battery jump, tire changes, fuel delivery, and minor repairs.",
  "url": "https://roadside.kitshub.vercel.app",
  "telephone": "+961 76 62 30 30",
  "email": "kits.tech.co@gmail.com",
  "logo": "https://roadside.kitshub.vercel.app/kits-logo.png",
  "image": "https://roadside.kitshub.vercel.app/kits-logo.png",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "LB",
    "addressRegion": "Beirut"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 33.8938,
    "longitude": 35.5018
  },
  "openingHours": "Mo-Su 00:00-23:59",
  "priceRange": "$$",
  "paymentAccepted": "Cash, Credit Card",
  "currenciesAccepted": "LBP, USD",
  "serviceType": [
    "Emergency Roadside Service",
    "Towing Service",
    "Battery Service",
    "Tire Service",
    "Fuel Delivery Service"
  ],
  "areaServed": {
    "@type": "Country",
    "name": "Lebanon"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+961 81 290 662",
    "contactType": "emergency",
    "availableLanguage": ["English", "Arabic", "French"],
    "hoursAvailable": "24/7"
  },
  "sameAs": [
    "https://www.instagram.com/kits_solutions",
    "https://kitshub.vercel.app"
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "150"
  }
}

export const breadcrumbStructuredData = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://roadside.kitshub.vercel.app"
    }
  ]
}

export const websiteStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "KiTS Roadside Assistance",
  "url": "https://roadside.kitshub.vercel.app",
  "description": "24/7 roadside assistance service across Lebanon",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://roadside.kitshub.vercel.app/?q={search_term_string}",
    "query-input": "required name=search_term_string"
  },
  "publisher": {
    "@type": "Organization",
    "name": "KiTS Hub",
    "url": "https://kitshub.vercel.app"
  }
}

// Stable stringification function to prevent hydration mismatches
function stableStringify(obj: any): string {
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return Object.keys(value).sort().reduce((sorted: any, k) => {
        sorted[k] = value[k]
        return sorted
      }, {})
    }
    return value
  })
}

// Stable stringified versions for hydration consistency
export const structuredDataString = stableStringify(structuredData)
export const breadcrumbStructuredDataString = stableStringify(breadcrumbStructuredData)
export const websiteStructuredDataString = stableStringify(websiteStructuredData)
