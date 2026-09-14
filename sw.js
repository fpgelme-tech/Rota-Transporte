// Rota Fiorino — service worker v5: página sempre da rede (com reserva offline); resto cache-first com atualização em segundo plano
const CACHE = 'rota-fiorino-v5';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (/tile\.openstreetmap|nominatim|photon\.komoot|brasilapi|googleapis\.com\/maps|routes\.googleapis/.test(url.host + url.pathname)) return;
  const isPage = e.request.mode === 'navigate' || /\/(index\.html)?$/.test(url.pathname);
  if (url.origin === location.origin && isPage) {
    // rede primeiro: sempre a versão mais nova; offline cai para a cópia guardada
    e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(res => { if (res.ok) caches.open(CACHE).then(c => c.put('./index.html', res.clone())); return res; }).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(e.request).then(hit => {
    const net = fetch(e.request).then(res => { if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone())); return res; }).catch(() => hit);
    return hit || net;
  }));
});
