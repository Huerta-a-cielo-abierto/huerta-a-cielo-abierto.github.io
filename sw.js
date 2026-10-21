// Guarda toda la app en el celular para que funcione sin internet.
// Cuando se cambie algo, subir el número de VERSION para que los celulares bajen lo nuevo.
var VERSION = 'huerta-v8';
var ARCHIVOS = [
  './', 'index.html', 'estilos.css', 'app.js', 'fichas.json', 'manifest.webmanifest',
  'vendor/jsQR.js', 'iconos/icono-180.png', 'iconos/icono-192.png', 'iconos/icono-512.png', 'iconos/ramita.svg'
];
for (var j = 1; j <= 9; j++) ARCHIVOS.push('fotos/0' + j + '.jpg');
for (var i = 1; i <= 25; i++) ARCHIVOS.push('laminas/' + (i < 10 ? '0' : '') + i + '.jpg');

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(ARCHIVOS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  if (e.request.mode === 'navigate') {
    e.respondWith(caches.match('index.html').then(function (r) { return r || fetch(e.request); }));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(function (r) {
    return r || fetch(e.request);
  }));
});
