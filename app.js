// Huerta C.E.P.T. N.° 30
// Cada ficha se abre solo con el código secreto de su cartel (lo que va después de # en el QR).
(function () {
  'use strict';

  var contenido = document.getElementById('contenido');
  var fichas = [];
  var porCodigo = {};
  var CLAVE_VISTAS = 'huerta-vistas-dia';
  var FOTOS = 9;
  var relojCarrusel = null;
  var eventoInstalar = null;
  var reintento = false;
  // Contador de visitas (GoatCounter). Solo manda el nombre de la ficha, nunca el código del QR ni datos de nadie.
  var CONTADOR = 'https://huerta-cept30.goatcounter.com/count';
  var CLAVE_PENDIENTES = 'huerta-visitas-pendientes';
  var ultimaContada = null;
  var NOMBRES_MES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto',
    'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  function esc(t) {
    return String(t == null ? '' : t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function color(fill) {
    return fill && fill !== 'auto' ? '#' + fill : '#ffffff';
  }

  // Fichas escaneadas hoy en este celular (la lista vuelve a cero cada día)
  function hoy() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }
  function leerVistas() {
    try {
      localStorage.removeItem('huerta-vistas');
      var g = JSON.parse(localStorage.getItem(CLAVE_VISTAS));
      return g && g.dia === hoy() && Array.isArray(g.codigos) ? g.codigos : [];
    } catch (e) { return []; }
  }
  function guardarVista(codigo) {
    try {
      var v = leerVistas().filter(function (c) { return c !== codigo; });
      v.unshift(codigo);
      localStorage.setItem(CLAVE_VISTAS, JSON.stringify({ dia: hoy(), codigos: v.slice(0, 40) }));
    } catch (e) { /* sin almacenamiento, no pasa nada */ }
  }

  function botonEscanear(flotante) {
    return '<button class="boton ' + (flotante ? 'flotante' : 'boton-ancho') +
      '" type="button" data-escanear>📷 Escanear un cartel</button>';
  }

  function verFicha(f) {
    var h = '';
    var aliado = f.sector === 'aliados';
    h += '<section class="caja encabezado' + (aliado ? ' aliados' : '') + '">';
    h += '<p class="tipo">' + esc(f.tipo) + '</p><p class="escuela">' +
      (aliado ? '🐞 Aliados de la huerta · C.E.P.T. N.° 30' : 'Huerta agroecológica · C.E.P.T. N.° 30') + '</p>';
    var largo = Math.max.apply(null, f.nombre.split(' ').map(function (p) { return p.length; }));
    h += '<h1 class="nombre"' + (largo > 11 ? ' style="font-size:clamp(24px,7.5vw,38px)"' : '') + '>' + esc(f.nombre) + '</h1>';
    if (f.cientifico) h += '<p class="cientifico">' + esc(f.cientifico) + '</p>';
    if (f.familia) h += '<p class="familia">' + esc(f.familia) + '</p>';
    var mesActual = new Date().getMonth() + 1;
    var meses = f.meses || [];
    var esEpoca = meses.indexOf(mesActual) !== -1;
    h += '<div class="etiquetas">';
    if (meses.length) h += '<span class="etiqueta' + (esEpoca ? ' epoca' : '') + '">' +
      (esEpoca ? '✅ Es época' : '⏳ Todavía no es época') + '</span>';
    h += '</div>';
    h += '</section>';

    if (meses.length) {
      h += '<section class="caja calendario" style="background:var(--celeste)"><h2>📅 Calendario de ' +
        (f.verbo === 'planta' ? 'plantación' : 'siembra') + '</h2><ol class="meses">';
      NOMBRES_MES.forEach(function (nm, i) {
        var m = i + 1, si = meses.indexOf(m) !== -1;
        h += '<li class="mes' + (si ? ' si' : '') + (m === mesActual ? ' hoy' : '') + '" title="' + nm + '">' +
          '<span class="letra">' + nm.charAt(0) + '</span><span class="corto">' + nm.slice(0, 3) + '</span></li>';
      });
      h += '</ol><p class="leyenda">Los meses pintados son los que la ficha indica para ' +
        (f.verbo === 'planta' ? 'plantar' : 'sembrar') + '. Estamos en <b>' + NOMBRES_MES[mesActual - 1].toLowerCase() +
        '</b>' + (esEpoca ? ', así que <b>es época</b> 🌱' : ', todavía no es época.') + '</p></section>';
    }

    h += '<section class="caja lamina"><h2>' + esc(f.lamina_titulo || '🔬 Lámina botánica') + '</h2>';
    h += '<img src="laminas/' + esc(f.n) + '.jpg" alt="' + (f.lamina_titulo ? 'Foto' : 'Lámina botánica') + ' de ' + esc(f.nombre.toLowerCase()) + '" loading="lazy">';
    if (f.lamina) h += '<p class="credito">' + esc(f.lamina) + '</p>';
    h += '</section>';

    f.filas.forEach(function (fila) {
      var cajas = fila.map(function (c) {
        return '<div class="caja" style="background:' + color(c.fill) + '"><h3>' + esc(c.t) +
          '</h3><p>' + esc(c.x) + '</p></div>';
      }).join('');
      h += fila.length > 1 ? '<div class="fila">' + cajas + '</div>' : cajas;
    });

    if (f.variedad) {
      var v = f.variedad;
      h += '<section class="caja variedad-tit" style="background:' + color(v.fill) + '"><h2>' +
        esc(v.titulo) + '</h2><p>' + esc(v.sub) + '</p></section>';
      h += '<table class="tabla"><tbody>';
      v.campos.forEach(function (c) {
        var pista = /^Pistas/.test(c.v);
        h += '<tr><th scope="row">' + esc(c.k) + '</th><td' + (pista ? ' class="pista"' : '') + '>' + esc(c.v) + '</td></tr>';
      });
      h += '</tbody></table>';
    }
    if (f.pie) h += '<p class="pie">' + esc(f.pie) + '</p>';
    h += botonEscanear(true);
    return h;
  }

  function verInicio() {
    var vistas = leerVistas().filter(function (c) { return porCodigo[c]; });
    var esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    var instalada = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    var h = '<div class="inicio">';
    h += '<img class="ramita" src="iconos/ramita.svg" alt="">';
    h += '<div class="carrusel" id="carrusel" aria-label="Fotos de la huerta">';
    for (var i = 1; i <= FOTOS; i++) {
      h += '<img src="fotos/0' + i + '.jpg" alt="Foto de la huerta del C.E.P.T. N.° 30"' + (i === 1 ? ' class="activa"' : ' loading="lazy"') + '>';
    }
    h += '<div class="puntos">';
    for (var j = 1; j <= FOTOS; j++) h += '<span' + (j === 1 ? ' class="on"' : '') + '></span>';
    h += '</div></div>';
    h += '<section class="caja bienvenida">';
    h += '<h1>Bienvenidos a la huerta 🌿</h1>';
    h += '<p>Escaneá el código QR de un cartel de la huerta y vas a ver la ficha de esa especie.</p>';
    h += '<p class="estado" id="estado">⏳ Preparando la app para usar sin internet…</p>';
    h += '</section>';
    h += botonEscanear(false);

    h += '<section class="caja sobre"><h2>🌻 Sobre el proyecto</h2>' +
      '<p>Este es un proyecto de toda la escuela, en el que participan las cuatro áreas del C.E.P.T. N.° 30, el Área de Promoción de la Producción, el Área de Promoción de la Comunicación, el Área de Promoción de la Comunidad Rural y su Cultura y el Área de Promoción de un Medio Ambiente Sustentable, junto con la Plantinera orgánica comunitaria y la Biblioteca de semillas.</p>' +
      '<p>Este proyecto nace del trabajo integrado y en articulación de las materias Ciencias Naturales, Ciencias Sociales, Agrosistemas, Inglés, Cuaderno de campo y P.I.C. de primer año. Detrás de cada cartel hay estudiantes que investigan, siembran y aprenden en esta huerta. Por eso cada ficha no muestra solo contenidos, también refleja lo que los estudiantes aportan día a día con su trabajo en la huerta de la escuela, cuando siembran, riegan, observan, registran y cuidan cada cultivo. Año tras año, cada grupo deja su huella sumando las variedades que se siembran.</p></section>';
    if (vistas.length) {
      h += '<section class="caja" style="background:var(--aqua-claro)"><h2>🌱 Las fichas que escaneaste hoy</h2><ul class="vistas">';
      vistas.forEach(function (c) {
        var f = porCodigo[c];
        h += '<li><a href="#' + esc(c) + '">' + esc(f.nombre) + ' <span>' + esc(f.cientifico) + '</span></a></li>';
      });
      h += '</ul></section>';
    }
    if (!instalada) {
      h += '<section class="caja" style="background:var(--celeste)"><h2>📲 Instalar la app (opcional)</h2>';
      if (esIOS) {
        h += '<p>No hace falta instalarla para usarla en la huerta. Si querés tenerla como app, abrí esta página con <b>Safari</b>.</p><ol class="pasos">' +
          '<li>Tocá el botón <b>Compartir</b> (el cuadradito con la flecha).</li>' +
          '<li>Elegí <b>Agregar a pantalla de inicio</b>.</li>' +
          '<li>Tocá <b>Agregar</b>.</li></ol>';
      } else {
        h += '<p>No hace falta instalarla para usarla en la huerta. Si querés tenerla como app, tocá el botón. Si aparece el aviso <b>“Se bloqueó la app no segura”</b>, tocá <b>Ver más</b>. No te preocupes, es seguro tocar <b>Instalar de todas formas</b>. La app queda en tu celular con el ícono de la huerta.</p>';
        h += '<p style="margin-top:10px"><button class="boton boton-claro boton-ancho" type="button" id="instalar"' +
          (eventoInstalar ? '' : ' hidden') + '>Instalar la app</button></p>';
        h += '<p id="instalar-ayuda"' + (eventoInstalar ? ' hidden' : '') + '>Si no aparece el botón, tocá los tres puntitos del navegador y elegí <b>Instalar aplicación</b> o <b>Agregar a pantalla principal</b>.</p>';
      }
      h += '</section>';
    }

    h += '<img class="ramita abajo" src="iconos/ramita.svg" alt="">';
    h += '</div>';
    return h;
  }

  function verNoEncontrada() {
    return '<section class="caja" style="background:var(--rosa)"><h1 style="margin:0 0 6px;font-size:22px">No encontramos esta ficha 🤔</h1>' +
      '<p>Probá escanear de nuevo el código QR del cartel.</p></section>' + botonEscanear(false);
  }

  // Guarda la visita en el celular y la manda cuando hay internet (en la huerta no hay señal)
  function leerPendientes() {
    try { var v = JSON.parse(localStorage.getItem(CLAVE_PENDIENTES) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; }
  }
  function guardarPendientes(v) {
    try { localStorage.setItem(CLAVE_PENDIENTES, JSON.stringify(v.slice(-300))); } catch (e) {}
  }
  var enviando = false;
  function enviarPendientes() {
    if (enviando || !navigator.onLine) return;
    var v = leerPendientes();
    if (!v.length) return;
    enviando = true;
    var h = v[0];
    var url = CONTADOR + '?p=' + encodeURIComponent(h.p) + '&t=' + encodeURIComponent(h.t) +
      '&s=' + encodeURIComponent(screen.width + ',' + screen.height + ',' + (window.devicePixelRatio || 1)) +
      '&rnd=' + Math.random().toString(36).slice(2);
    fetch(url, { mode: 'no-cors', cache: 'no-store', keepalive: true })
      .then(function () {
        guardarPendientes(leerPendientes().slice(1));
        enviando = false;
        enviarPendientes();
      })
      .catch(function () { enviando = false; });
  }
  function contarVisita(ruta, titulo) {
    if (ruta === ultimaContada) return;
    ultimaContada = ruta;
    if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return;
    var v = leerPendientes();
    v.push({ p: ruta, t: titulo });
    guardarPendientes(v);
    enviarPendientes();
  }
  window.addEventListener('online', enviarPendientes);

  function mostrar() {
    var codigo = decodeURIComponent(location.hash.replace(/^#\/?/, '')).trim().toLowerCase();
    var f = porCodigo[codigo];
    if (relojCarrusel) { clearInterval(relojCarrusel); relojCarrusel = null; }
    document.body.classList.toggle('sector-aliados', !!(f && f.sector === 'aliados'));
    if (!codigo) {
      contenido.innerHTML = verInicio();
      iniciarCarrusel();
      document.title = 'Huerta C.E.P.T. N.° 30';
      contarVisita('/', 'Inicio');
      actualizarEstado();
      prepararInstalar();
    } else if (f) {
      contenido.innerHTML = verFicha(f);
      document.title = f.nombre.charAt(0) + f.nombre.slice(1).toLowerCase() + ' · Huerta C.E.P.T. N.° 30';
      guardarVista(codigo);
      contarVisita('/' + f.nombre.toLowerCase().replace(/\s+/g, '-'), f.nombre.charAt(0) + f.nombre.slice(1).toLowerCase());
    } else {
      contenido.innerHTML = verNoEncontrada();
      if (!reintento && navigator.onLine) {
        reintento = true;
        cargarFichas().catch(function () {});
        // Si sigue sin aparecer, actualiza la app guardada y recarga una sola vez
        setTimeout(function () {
          var clave = 'huerta-recarga-' + codigo;
          var yaRecargo = false;
          try { yaRecargo = sessionStorage.getItem(clave); sessionStorage.setItem(clave, '1'); } catch (e) { yaRecargo = true; }
          if (porCodigo[codigo] || yaRecargo || !('serviceWorker' in navigator)) return;
          navigator.serviceWorker.getRegistration().then(function (reg) { return reg && reg.update(); })
            .catch(function () {}).then(function () { setTimeout(function () { location.reload(); }, 1500); });
        }, 2500);
      }
    }
    window.scrollTo(0, 0);
  }

  // Carrusel de fotos de la huerta
  function iniciarCarrusel() {
    var c = document.getElementById('carrusel');
    if (!c) return;
    var fotos = c.querySelectorAll('img');
    var puntos = c.querySelectorAll('.puntos span');
    var actual = 0;
    function ir(n) {
      fotos[actual].classList.remove('activa'); puntos[actual].classList.remove('on');
      actual = (n + fotos.length) % fotos.length;
      fotos[actual].classList.add('activa'); puntos[actual].classList.add('on');
    }
    function reiniciar() {
      if (relojCarrusel) clearInterval(relojCarrusel);
      relojCarrusel = setInterval(function () { ir(actual + 1); }, 4500);
    }
    var x0 = null;
    c.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    c.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) { ir(actual + (dx < 0 ? 1 : -1)); reiniciar(); }
    });
    reiniciar();
  }

  // Estado sin conexión
  function actualizarEstado() {
    var el = document.getElementById('estado');
    if (!el || !('serviceWorker' in navigator)) { if (el) el.hidden = true; return; }
    navigator.serviceWorker.ready.then(function () {
      return caches.keys();
    }).then(function (keys) {
      if (!keys.length) return;
      var e = document.getElementById('estado');
      if (e) e.textContent = '✅ Lista para usar sin internet';
    }).catch(function () {});
  }

  function prepararInstalar() {
    var b = document.getElementById('instalar');
    if (!b) return;
    b.addEventListener('click', function () {
      if (!eventoInstalar) return;
      eventoInstalar.prompt();
      eventoInstalar.userChoice.finally(function () { eventoInstalar = null; mostrar(); });
    });
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    eventoInstalar = e;
    var b = document.getElementById('instalar');
    var a = document.getElementById('instalar-ayuda');
    if (b) b.hidden = false;
    if (a) a.hidden = true;
  });

  // Escáner de QR dentro de la app
  var escaner = document.getElementById('escaner');
  var video = document.getElementById('video');
  var texto = document.getElementById('escaner-texto');
  var flujo = null, corriendo = false, detector = null;
  var lienzo = document.createElement('canvas');
  var ctx = lienzo.getContext('2d', { willReadFrequently: true });

  function codigoDesdeTexto(t) {
    var m = /#\/?([a-z0-9]{4,12})\s*$/i.exec(t || '');
    return m ? m[1].toLowerCase() : null;
  }

  function abrirEscaner() {
    texto.textContent = 'Apuntá la cámara al código QR del cartel';
    escaner.hidden = false;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      texto.textContent = 'Este celular no deja usar la cámara desde la app. Escaneá el cartel con la cámara del celular.';
      return;
    }
    if ('BarcodeDetector' in window) {
      try { detector = new window.BarcodeDetector({ formats: ['qr_code'] }); } catch (e) { detector = null; }
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then(function (s) {
        flujo = s; video.srcObject = s; return video.play();
      })
      .then(function () { corriendo = true; requestAnimationFrame(leer); })
      .catch(function () {
        texto.textContent = 'No pudimos abrir la cámara. Revisá que la app tenga permiso para usarla.';
      });
  }

  function cerrarEscaner() {
    corriendo = false;
    if (flujo) flujo.getTracks().forEach(function (t) { t.stop(); });
    flujo = null;
    escaner.hidden = true;
  }

  function encontrado(valor) {
    var c = codigoDesdeTexto(valor);
    if (c && porCodigo[c]) {
      cerrarEscaner();
      if (location.hash === '#' + c) mostrar(); else location.hash = c;
      return true;
    }
    texto.textContent = 'Este código no es de un cartel de la huerta. Probá con otro 🌱';
    return false;
  }

  function leer() {
    if (!corriendo) return;
    if (video.readyState < 2) { requestAnimationFrame(leer); return; }
    if (detector) {
      detector.detect(video).then(function (r) {
        if (r.length && encontrado(r[0].rawValue)) return;
        setTimeout(function () { requestAnimationFrame(leer); }, 150);
      }).catch(function () { detector = null; requestAnimationFrame(leer); });
      return;
    }
    var w = video.videoWidth, h = video.videoHeight, lado = Math.min(w, h, 720);
    lienzo.width = lado; lienzo.height = lado;
    ctx.drawImage(video, (w - Math.min(w, h)) / 2, (h - Math.min(w, h)) / 2, Math.min(w, h), Math.min(w, h), 0, 0, lado, lado);
    var img = ctx.getImageData(0, 0, lado, lado);
    var r = window.jsQR ? window.jsQR(img.data, lado, lado, { inversionAttempts: 'dontInvert' }) : null;
    if (r && encontrado(r.data)) return;
    setTimeout(function () { requestAnimationFrame(leer); }, 120);
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-escanear]')) abrirEscaner();
  });
  document.getElementById('cerrar-escaner').addEventListener('click', cerrarEscaner);
  window.addEventListener('hashchange', function () { ultimaContada = null; mostrar(); });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').then(function () { actualizarEstado(); }).catch(function () {});
    });
  }

  function cargarFichas() {
    return fetch('fichas.json', { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        fichas = data;
        porCodigo = {};
        fichas.forEach(function (f) { porCodigo[f.code] = f; });
        mostrar();
      });
  }

  // Si la app se actualiza mientras está abierta, vuelve a leer las fichas
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', function () { cargarFichas().catch(function () {}); });
  }

  cargarFichas()
    .catch(function () {
      contenido.innerHTML = '<section class="caja" style="background:var(--rosa)"><p>No se pudieron cargar las fichas. Abrí la app una vez con internet para que se guarden en el celular.</p></section>';
    });
})();
