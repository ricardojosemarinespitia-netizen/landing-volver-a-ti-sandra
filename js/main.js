(function () {
  'use strict';

  /* firma: el lazo que vuelve sobre sí mismo se dibuja una vez */
  var lazo = document.querySelector('.hero__lazo');
  if (lazo) {
    var lp = lazo.querySelector('path');
    lazo.style.setProperty('--len', Math.ceil(lp.getTotalLength()));
    lazo.classList.add('is-trazo');
  }

  /* nav + barra móvil: un listener pasivo, trabajo en rAF */
  var nav = document.getElementById('nav');
  var barra = document.getElementById('barra-movil');
  var zonas = [document.getElementById('entradas'), document.getElementById('inscripcion')];
  var flotante = document.getElementById('flotante');
  var cinta = document.getElementById('cinta');
  var cintaVista = false;
  try { cintaVista = sessionStorage.getItem('vat-cinta') === '1'; } catch (e) {}
  function cerrarCinta() {
    cinta.hidden = true; cintaVista = true;
    try { sessionStorage.setItem('vat-cinta', '1'); } catch (e) {}
  }
  if (cinta) {
    document.getElementById('cinta-x').addEventListener('click', cerrarCinta);
    cinta.querySelector('.cinta__ir').addEventListener('click', cerrarCinta);
  }
  var tick = false;
  function visible(el) { var r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; }
  function onScroll() {
    if (tick) return; tick = true;
    requestAnimationFrame(function () {
      var y = window.scrollY;
      nav.classList.toggle('is-scrolled', y > 8);
      var mostrarCta = y > innerHeight * 0.7 && !zonas.some(visible);
      barra.classList.toggle('is-on', mostrarCta);
      if (flotante) flotante.classList.toggle('is-on', mostrarCta);
      var alto = document.documentElement.scrollHeight - innerHeight;
      if (cinta && !cintaVista && !document.documentElement.classList.contains('hoja-abierta') && alto > 0 && y / alto >= 0.6) { cinta.hidden = false; cintaVista = true; }
      tick = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* reveal por bloque */
  var revs = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    revs.forEach(function (el) { io.observe(el); });
  } else {
    revs.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ======================================================
     FORMULARIO · hoja modal por pasos
     ====================================================== */

  /**
   * enviarFormulario(datos) — ÚNICO punto de conexión con el destino.
   * Hoy NO envía nada: no hay fetch, ni mailto, ni servicios de terceros.
   * Para conectar el destino (correo, WhatsApp u hoja de cálculo) basta con
   * reemplazar el cuerpo de esta función y devolver una promesa:
   *   resolve()  -> se muestra la pantalla de gracias
   *   reject(e)  -> se muestra el error y se conservan las respuestas
   * `datos` es un objeto plano: { ocupacion, motivo, llevarte, inversion,
   * futuro, nombre, correo, whatsapp, autoriza_datos, autoriza_comercial }.
   * No se guarda nada en localStorage.
   */
  /* URL de la aplicación web de Google Apps Script que escribe en la hoja de
     cálculo (termina en /exec). Mientras esté vacía, el formulario NO envía nada. */
  var ENDPOINT_HOJA = 'https://script.google.com/macros/s/AKfycbz92SLCTBneQdP5AQMhWBXQcBDP0E0rKY1BIBD1mz8USegJt2uwF_BR334xYmJk_F2Z/exec';

  function enviarFormulario(datos) {
    if (!ENDPOINT_HOJA) return Promise.resolve({ enviado: false, datos: datos });
    datos.origen = location.hostname + location.pathname + (datos.entrada ? ' | entrada: ' + datos.entrada : '') +
      (datos.entrada_form ? ' | entrada_form: ' + datos.entrada_form : '');
    delete datos.entrada; delete datos.entrada_form;
    // text/plain evita la comprobación previa (preflight) que Apps Script no soporta.
    return fetch(ENDPOINT_HOJA, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(datos)
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (r) {
      if (!r || r.ok !== true) throw new Error('Respuesta inválida');
      return r;
    });
  }

  var hoja = document.getElementById('form-volver');
  if (hoja && typeof hoja.showModal === 'function') {
    var form = document.getElementById('form-volver-f');
    var pasos = [].slice.call(hoja.querySelectorAll('.paso'));
    var total = pasos.length;
    var intro = document.getElementById('hoja-intro');
    var cuenta = document.getElementById('hoja-cuenta');
    var barraH = document.getElementById('hoja-barra');
    var btnAtras = document.getElementById('hoja-atras');
    var btnSig = document.getElementById('hoja-sig');
    var pie = document.getElementById('hoja-pie');
    var pieFin = document.getElementById('hoja-pie-fin');
    var gracias = document.getElementById('hoja-gracias');
    var cuerpo = document.getElementById('hoja-cuerpo');
    var actual = 0, abridor = null, enviado = false, entrada = '', entradaForm = '';
    var pagos = hoja.querySelector('.pagos');

    /* la entrada elegida destaca su botón de pago; sin elección, ambos iguales */
    function marcarEntrada() {
      if (entrada) pagos.setAttribute('data-elegida', entrada); else pagos.removeAttribute('data-elegida');
      pagos.querySelectorAll('.pago').forEach(function (a) { a.classList.toggle('is-elegida', a.getAttribute('data-pago') === entrada); });
      if (entrada === 'individual') pagos.insertBefore(document.getElementById('pago-individual'), pagos.firstChild);
      if (entrada === 'pareja') pagos.insertBefore(document.getElementById('pago-pareja'), pagos.firstChild);
    }
    var DUR = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--d3')) || 0;

    document.querySelectorAll('[data-con-js]').forEach(function (el) { el.hidden = false; });

    function mostrar(i, atras) {
      pasos.forEach(function (p, k) {
        p.hidden = k !== i;
        p.classList.remove('is-entra', 'is-atras');
      });
      var p = pasos[i];
      void p.offsetWidth;
      p.classList.add('is-entra');
      if (atras) p.classList.add('is-atras');
      intro.hidden = i !== 0;
      actual = i;
      cuenta.textContent = i < total - 1 ? 'Pregunta ' + (i + 1) + ' de ' + total : 'Último paso · ' + total + ' de ' + total;
      barraH.style.setProperty('--avance', ((i + 1) / total).toFixed(4));
      btnAtras.hidden = i === 0;
      btnSig.textContent = i < total - 1 ? 'Siguiente' : 'Enviar mis respuestas';
      cuerpo.scrollTop = 0;
    }

    function enfocarPregunta() {
      var q = pasos[actual].querySelector('.paso__q');
      if (q) q.focus({ preventScroll: true });
    }

    function marcar(el, errEl, msg) {
      if (el) el.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (errEl) errEl.textContent = msg || '';
      return !msg;
    }

    function validarPaso(i) {
      var p = pasos[i];
      var radios = p.querySelectorAll('input[type=radio]');
      if (radios.length) {
        var ok = [].some.call(radios, function (r) { return r.checked; });
        var err = p.querySelector('.hoja__error');
        err.textContent = ok ? '' : 'Elige una opción para continuar.';
        if (!ok) radios[0].focus();
        return ok;
      }
      if (i !== total - 1) return true;

      var primero = null;
      function chequear(campo, msg) {
        var errEl = document.getElementById('err-' + (campo.name === 'autoriza_datos' ? 'autoriza' : campo.name));
        marcar(campo, errEl, msg);
        if (msg && !primero) primero = campo;
      }
      var nombre = form.elements.nombre, correo = form.elements.correo, wa = form.elements.whatsapp, aut = form.elements.autoriza_datos;
      var vNom = nombre.value.trim(), vCor = correo.value.trim(), vWa = wa.value.trim();
      var digitos = vWa.replace(/[\s()-]/g, '');

      chequear(nombre, vNom.length < 3 ? 'Escribe tu nombre completo.' : '');
      chequear(correo, !vCor ? 'Escribe tu correo electrónico.' :
        !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(vCor) ? 'Revisa el correo: debe tener la forma nombre@dominio.com.' : '');
      chequear(wa, !vWa ? 'Escribe tu número de WhatsApp.' :
        !/^\+?\d+$/.test(digitos) ? 'Usa solo números; puedes empezar con + y el indicativo del país.' :
        (digitos.replace('+', '').length < 10 || digitos.replace('+', '').length > 15) ? 'Revisa el número: debe tener al menos 10 dígitos.' : '');
      chequear(aut, aut.checked ? '' : 'Para enviar tus respuestas necesitamos tu autorización de tratamiento de datos.');
      if (primero) primero.focus();
      return !primero;
    }

    /* al corregir, el error se limpia sin borrar lo escrito */
    form.addEventListener('input', function (e) {
      var t = e.target;
      if (t.type === 'radio') { var er = t.closest('.paso').querySelector('.hoja__error'); if (er) er.textContent = ''; return; }
      if (t.getAttribute('aria-invalid') === 'true') {
        var id = 'err-' + (t.name === 'autoriza_datos' ? 'autoriza' : t.name);
        marcar(t, document.getElementById(id), '');
      }
    });

    function datosDelFormulario() {
      var d = {};
      ['ocupacion', 'motivo', 'inversion', 'futuro'].forEach(function (n) {
        var r = form.querySelector('input[name="' + n + '"]:checked'); d[n] = r ? r.value : '';
      });
      d.llevarte = form.elements.llevarte.value.trim();
      d.nombre = form.elements.nombre.value.trim();
      d.correo = form.elements.correo.value.trim();
      d.whatsapp = form.elements.whatsapp.value.trim();
      d.autoriza_datos = form.elements.autoriza_datos.checked;
      d.autoriza_comercial = form.elements.autoriza_comercial.checked;
      d.entrada = entrada;
      d.entrada_form = entradaForm;
      return d;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (enviado) return;
      if (!validarPaso(actual)) return;
      if (actual < total - 1) { mostrar(actual + 1); enfocarPregunta(); return; }
      btnSig.disabled = true;
      btnSig.textContent = 'Enviando…';
      enviarFormulario(datosDelFormulario()).then(function () {
        enviado = true;
        pasos.forEach(function (p) { p.hidden = true; });
        intro.hidden = true;
        marcarEntrada();
        gracias.hidden = false;
        var gp = gracias.querySelector('path');
        gracias.style.setProperty('--len', Math.ceil(gp.getTotalLength()));
        gracias.classList.add('is-on');
        pie.hidden = true; pieFin.hidden = false;
        cuenta.textContent = 'Respuestas enviadas · falta el pago';
        barraH.style.setProperty('--avance', 1);
        cuerpo.scrollTop = 0;
        document.getElementById('gracias-t').focus({ preventScroll: true });
      }, function () {
        btnSig.disabled = false;
        btnSig.textContent = 'Enviar mis respuestas';
        pasos[actual].querySelector('.campo__err').textContent = 'No pudimos enviar tus respuestas. Revisa tu conexión e inténtalo de nuevo; lo que escribiste sigue aquí.';
      });
    });

    btnAtras.addEventListener('click', function () {
      if (actual > 0) { mostrar(actual - 1, true); enfocarPregunta(); }
    });

    function abrir(e) {
      if (e) e.preventDefault();
      abridor = document.activeElement;
      var elegida = e && e.currentTarget && e.currentTarget.getAttribute ? e.currentTarget.getAttribute('data-entrada') : null;
      if (elegida) { entrada = elegida; if (enviado) marcarEntrada(); }
      var org = e && e.currentTarget && e.currentTarget.getAttribute ? e.currentTarget.getAttribute('data-origen') : null;
      if (org && !entradaForm) entradaForm = org;
      if (!hoja.open) {
        hoja.showModal();
        document.documentElement.classList.add('hoja-abierta');
        if (!enviado) mostrar(actual);
        requestAnimationFrame(function () { requestAnimationFrame(function () { hoja.classList.add('is-abierta'); }); });
        (enviado ? document.getElementById('gracias-t') : pasos[actual].querySelector('.paso__q')).focus({ preventScroll: true });
      }
    }

    var cerrando = false;
    function cerrar(destino) {
      if (!hoja.open || cerrando) return;
      cerrando = true;
      hoja.classList.remove('is-abierta');
      setTimeout(function () {
        hoja.close();
        cerrando = false;
        document.documentElement.classList.remove('hoja-abierta');
        if (destino) {
          var el = document.querySelector(destino);
          if (el) { el.scrollIntoView(); el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true }); }
        } else if (abridor && abridor.focus) {
          abridor.focus({ preventScroll: true });
        }
      }, DUR + 30);
    }

    document.querySelectorAll('[data-abrir-form]').forEach(function (b) { b.addEventListener('click', abrir); });

    /* captación inline: la respuesta 1 se guarda y el diálogo abre en la pregunta 2 */
    document.querySelectorAll('[data-ocupacion]').forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.getAttribute('data-ocupacion');
        var r = [].filter.call(form.querySelectorAll('input[name="ocupacion"]'), function (x) { return x.value === v; })[0];
        if (r && !enviado) { r.checked = true; pasos[0].querySelector('.hoja__error').textContent = ''; if (actual === 0) actual = 1; }
        if (!entradaForm) entradaForm = 'hero-inline';
        abrir();
      });
    });
    hoja.querySelectorAll('[data-cerrar-form]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); cerrar(b.getAttribute('href')); });
    });
    /* Esc: animamos la salida en vez del cierre seco */
    hoja.addEventListener('cancel', function (e) { e.preventDefault(); cerrar(); });
    /* clic en el fondo oscuro cierra */
    hoja.addEventListener('click', function (e) { if (e.target === hoja) cerrar(); });
  }

  /* panel de revisión (?revision=1) */
  if (/[?&]revision=1\b/.test(location.search)) {
    var panel = document.getElementById('revision');
    var lista = document.getElementById('rev-lista');
    var vistos = {};
    document.querySelectorAll('header .falta, main .falta, footer .falta, #form-volver .falta').forEach(function (f) {
      var txt = f.textContent.replace(/^\[FALTA:\s*/, '').replace(/\]$/, '');
      if (vistos[txt]) return; vistos[txt] = 1;
      var sec = f.closest('[id]');
      var li = document.createElement('li');
      li.textContent = txt + (sec && sec.id ? '  (#' + sec.id + ')' : '');
      lista.appendChild(li);
    });
    panel.hidden = false;
  }
})();
