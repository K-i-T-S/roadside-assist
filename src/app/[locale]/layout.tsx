import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { Geist, Geist_Mono, Noto_Sans_Arabic } from "next/font/google"
import ErrorBoundary from '@/components/ErrorBoundary'
import ClientHtmlSetter from '@/components/ClientHtmlSetter'
import "../globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

// Add Arabic font for better Arabic support
const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
})

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params

  // Validate locale
  if (!['en', 'fr', 'ar'].includes(locale)) {
    notFound()
  }

  const messages = await getMessages({ locale })
  const meta = messages.meta as { title: string; description: string; keywords: string[] }

  const baseUrl = 'https://roadside.kitshub.vercel.app'

  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    authors: [{ name: "KiTS Hub" }],
    creator: "KiTS Hub",
    publisher: "KiTS Hub",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        'en': '/en',
        'fr': '/fr',
        'ar': '/ar',
      },
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `${baseUrl}/${locale}`,
      siteName: "KiTS Roadside Assistance",
      locale: locale === 'ar' ? 'ar_LB' : locale === 'fr' ? 'fr_LB' : 'en_LB',
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      creator: "@KiTS_Hub",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      google: "your-google-verification-code",
    },
  }
}

const locales = ['en', 'fr', 'ar']

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale)) notFound()

  const messages = await getMessages({ locale })
  const isRTL = locale === 'ar'

  return (
    <>
      <ClientHtmlSetter locale={locale} isRTL={isRTL} />

      <ErrorBoundary>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </ErrorBoundary>
    </>
  )
}
