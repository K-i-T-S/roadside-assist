// Hand-written service worker (next-pwa is incompatible with this project's
// Turbopack build — it only hooks into the webpack() config callback, which
// Turbopack never calls). Bump CACHE_NAME when the precached asset list below
// changes, or when the caching strategy changes, so old caches get cleaned up
// on activate.
const CACHE_NAME = 'kits-roadside-v2'

const APP_SHELL = [
  '/',
  '/site.webmanifest',
  '/kits-logo.png',
  '/icon-192x192.png',
  '/icon-512x512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Only ever handle same-origin GETs; let the browser deal with everything
  // else (Supabase auth/data, Google Maps, etc.).
  if (url.origin !== self.location.origin) return

  // Navigations: try the network first (so users always get the live app
  // when online), fall back to the cached app shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/').then((cached) => cached || Response.error())
      )
    )
    return
  }

  // Application code / build output must ALWAYS be served fresh when online.
  // Next.js chunks, RSC payloads and the bundled client code (including the
  // Supabase auth client) live under /_next/. Caching these cache-first
  // silently pins the browser to a stale build — that is exactly what broke
  // admin login: an old, pre-cookie-auth bundle kept being served from the
  // cache and shadowed every source change. Use network-first here, with a
  // cache fallback only for offline use. Likewise never cache API responses.
  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || Response.error())
        )
    )
    return
  }

  // API routes: always go to the network, never serve a cached copy.
  if (url.pathname.startsWith('/api/')) return

  // Remaining same-origin static assets (images, icons, manifest, fonts) have
  // stable URLs and content, so cache-first is safe and gives offline support.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
    })
  )
})
