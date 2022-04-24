const staticFiles = 'dev-bfx-reports-framework-v1'
const assets = [
  '/',
  'index.html',
  'manifest.json',
  'favicon.ico',
  'icons/16x16.png',
  'icons/24x24.png',
  'icons/32x32.png',
  'icons/48x48.png',
  'icons/64x64.png',
  'icons/96x96.png',
  'icons/128x128.png',
  'icons/256x256.png',
  'icons/512x512.png'
]

self.addEventListener('install', installEvent => {
  installEvent.waitUntil(
    caches.open(staticFiles).then(cache => {
      cache.addAll(assets)
    })
  )
})

self.addEventListener('fetch', fetchEvent => {
  fetchEvent.respondWith(
    caches.match(fetchEvent.request).then(res => {
      return res || fetch(fetchEvent.request)
    })
  )
})
