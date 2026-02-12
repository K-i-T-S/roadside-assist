// Type declarations for Next.js configuration
declare module 'next' {
  interface NextConfig {
    experimental?: {
      serverComponentsExternalPackages?: string[]
    }
  }
}
