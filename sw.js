// Rota Fiorino — service worker: app shell offline, rede primeiro para o resto
const CACHE = 'rota-fiorino-v4';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // geocodificação e APIs: sempre rede
  if (/tile\.openstreetmap|nominatim|photon.komoot|brasilapi|googleapis\.com\/maps|routes.googleapis/.test(url.host + url.pathname)) return;
  // app shell (mesma origem): cache primeiro, atualiza em segundo plano
  if (url.origin === location.origin) {
    e.respondWith(caches.match(e.request).then(hit => {
      const net = fetch(e.request).then(res => { if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone())); return res; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  // bibliotecas e fontes de CDN: rede, com cache de reserva
  e.respondWith(fetch(e.request).then(res => { if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone())); return res; }).catch(() => caches.match(e.request)));
});
