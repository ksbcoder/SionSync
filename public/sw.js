const CACHE = 'sionsync-v1';
const STATIC = ['/', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || !url.protocol.startsWith('http')) return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// Llega una notificación Push: mostrarla en pantalla.
self.addEventListener('push', e => {
  let datos = {};
  try {
    datos = e.data ? e.data.json() : {};
  } catch {
    datos = { title: 'SionSync', body: e.data ? e.data.text() : '' };
  }
  const title = datos.title || 'SionSync';
  const options = {
    body: datos.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge.png',
    data: { url: datos.url || '/' },
    tag: datos.tag,            // avisos con el mismo tag se reemplazan, no se apilan
    renotify: Boolean(datos.tag),
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

// El usuario toca la notificación: abrir la app (o enfocarla si ya está abierta).
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const destino = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientes => {
      for (const cliente of clientes) {
        if ('focus' in cliente) {
          cliente.navigate(destino);
          return cliente.focus();
        }
      }
      return self.clients.openWindow(destino);
    })
  );
});
