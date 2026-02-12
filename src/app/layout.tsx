import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { structuredData, breadcrumbStructuredData, websiteStructuredData } from './structured-data';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KiTS Roadside Assistance - 24/7 Emergency Help in Lebanon",
  description: "Fast, reliable roadside assistance in Lebanon. 24/7 towing, battery jump, tire changes, fuel delivery, and minor repairs. Get help now!",
  keywords: "roadside assistance, towing, battery jump, flat tire, fuel delivery, Lebanon, 24/7 emergency",
  authors: [{ name: "KiTS Hub" }],
  creator: "KiTS Hub",
  publisher: "KiTS Hub",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://roadside.kitshub.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "KiTS Roadside Assistance - 24/7 Emergency Help",
    description: "Fast, reliable roadside assistance in Lebanon. Get help 24/7!",
    url: "https://roadside.kitshub.vercel.app",
    siteName: "KiTS Roadside Assistance",
    locale: "en_LB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KiTS Roadside Assistance - 24/7 Emergency Help",
    description: "Fast, reliable roadside assistance in Lebanon. Get help 24/7!",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/kits-logo.png" sizes="any" />
        <link rel="icon" href="/kits-logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/kits-logo.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Preconnect to Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        {children}
      </body>
    </html>
  );
}
