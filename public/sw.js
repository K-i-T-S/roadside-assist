// Hand-written service worker (next-pwa is incompatible with this project's
// Turbopack build — it only hooks into the webpack() config callback, which
// Turbopack never calls). Bump CACHE_NAME when the precached asset list below
// changes so old caches get cleaned up on activate.
const CACHE_NAME = 'kits-roadside-v1'

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

  // Same-origin static assets: cache-first, populate the cache on first
  // network fetch. Next.js's hashed build output isn't precached above (its
  // filenames change every build), but it still gets cached opportunistically
  // here after first load.
  const url = new URL(request.url)
  if (url.origin === self.location.origin) {
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
  }
})
