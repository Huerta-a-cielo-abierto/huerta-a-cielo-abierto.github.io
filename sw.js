// Guarda toda la app en el celular para que funcione sin internet.
// Cuando se cambie algo, subir el número de VERSION para que los celulares bajen lo nuevo.
var VERSION = 'huerta-v19';
var ARCHIVOS = [
  './', 'index.html', 'estilos.css', 'app.js', 'fichas.json', 'manifest.webmanifest',
  'vendor/jsQR.js', 'iconos/icono-180.png', 'iconos/icono-192.png', 'iconos/icono-512.png', 'iconos/ramita.svg', 'iconos/cept-logo.png'
];
for (var j = 1; j <= 9; j++) ARCHIVOS.push('fotos/0' + j + '.jpg');
for (var i = 1; i <= 28; i++) ARCHIVOS.push('laminas/' + (i < 10 ? '0' : '') + i + '.jpg');

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(ARCHIVOS.map(function (u) { return new Request(u, { cache: 'reload' }); })); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  // El contador de visitas va directo a internet, sin pasar por lo guardado
  if (new URL(e.request.url).origin !== self.location.origin) return;
  // Las fichas se buscan primero en internet, así un cartel nuevo se abre aunque el celular tenga la versión vieja guardada
  if (new URL(e.request.url).pathname.endsWith('/fichas.json')) {
    e.respondWith(fetch(e.request, { cache: 'no-store' }).then(function (r) {
      var copia = r.clone();
      if (r.ok) caches.open(VERSION).then(function (c) { c.put('fichas.json', copia); });
      return r;
    }).catch(function () {
      return caches.match('fichas.json', { ignoreSearch: true });
    }));
    return;
  }
  if (e.request.mode === 'navigate') {
    e.respondWith(caches.match('index.html').then(function (r) { return r || fetch(e.request); }));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(function (r) {
    return r || fetch(e.request);
  }));
});
