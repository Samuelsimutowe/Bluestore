// Keeps Bluestore available offline: loads from the network when possible, otherwise from the saved copy.
// Only the app itself and the Firebase library are saved; Firebase's data traffic is left alone.
const CACHE = 'bluestore-v5';
const APP_FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(APP_FILES.map(file => c.add(file)))));
});
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(names => Promise.all(names.filter(n => n !== CACHE).map(n => caches.delete(n)))).then(() => clients.claim())));
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const ours = url.origin === location.origin || url.hostname === 'www.gstatic.com';
  if (e.request.method !== 'GET' || !ours) return;
  e.respondWith(fetch(e.request).then(res => {
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(e.request, copy));
    return res;
  }).catch(() => caches.match(e.request)));
});
