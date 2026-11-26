const CACHE = 'reparae-static-v1';
const STATIC = ["./offline.html", "./manifest.json", "./imagens/pwa-192.png", "./imagens/pwa-512.png", "./estilos/app.css", "./estilos/auth.css", "./estilos/base.css", "./estilos/chat.css", "./estilos/componentes.css", "./estilos/landing.css", "./estilos/tokens.css"];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(STATIC)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('reparae-static-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || request.headers.has('Authorization')) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(new URL('./offline.html', self.registration.scope).href)));
    return;
  }
  if (!STATIC.some(path => new URL(path, self.registration.scope).href === url.href)) return;
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});
