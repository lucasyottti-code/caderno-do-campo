/* ============================================================
   ANÁLISE DO SITE
   1) Medição própria do painel: anônima, sem cookies, conta todo mundo.
      Manda os eventos pro coletor (planilha Google) definido em config.js.
   2) Google Analytics 4 + Microsoft Clarity: só depois do "Aceitar"
      no aviso de cookies (LGPD).
   - Aparelho do administrador (abriu o painel, ?admin ou ?editar)
     fica fora de tudo.
   - Repassa a origem do tráfego (UTM) pro checkout da Kiwify.
   ============================================================ */
(function () {
  var C = window.CC_CONFIG || {};
  var qs = location.search + location.hash;

  /* ---------- administrador ---------- */
  var admin = false;
  try {
    if (/[?#&]sair-admin\b/.test(qs)) localStorage.removeItem('cc_admin');
    else if (/[?#&](admin|editar)\b/.test(qs)) localStorage.setItem('cc_admin', '1');
    admin = localStorage.getItem('cc_admin') === '1';
  } catch (e) { admin = /[?#&](admin|editar)\b/.test(qs); }
  var emIframe = (function () { try { return window.self !== window.top; } catch (e) { return true; } })();
  window.CC_ADMIN = admin;

  /* ---------- equipe: aparelho fora das estatísticas, sem botões de admin ---------- */
  var equipe = false;
  try {
    if (/[?#&]sair-equipe\b/.test(qs)) localStorage.removeItem('cc_equipe');
    else if (/[?#&]equipe\b/.test(qs)) localStorage.setItem('cc_equipe', '1');
    equipe = localStorage.getItem('cc_equipe') === '1';
    if (/[?#&](sair-)?equipe\b/.test(qs) && window.history && history.replaceState) {
      var limpa = location.search.replace(/[?&](sair-)?equipe\b[^&]*/g, '').replace(/^&/, '?');
      history.replaceState(null, '', location.pathname + (limpa === '?' ? '' : limpa) + location.hash);
    }
  } catch (e) {}
  if (equipe) admin = true;   // mesma regra do admin pra medição: não conta

  /* ---------- origem do tráfego -> checkout ---------- */
  var links = [].slice.call(document.querySelectorAll('a[href*="pay.kiwify.com.br"]'));
  var params = null;
  try { params = new URLSearchParams(location.search); } catch (e) {}
  try {
    var extra = [];
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'src', 'sck'].forEach(function (k) {
      var v = params && params.get(k); if (v) extra.push([k, v]);
    });
    if (extra.length) links.forEach(function (a) {
      var u = new URL(a.href);
      extra.forEach(function (kv) { if (!u.searchParams.has(kv[0])) u.searchParams.set(kv[0], kv[1]); });
      a.href = u.toString();
    });
  } catch (e) {}

  function localDoBotao(a) {
    var sec = a.closest('section');
    return a.closest('.fixo') ? 'fixo' : (sec && sec.id) || 'outro';
  }

  /* ============================================================
     1) MEDIÇÃO PRÓPRIA (painel) — anônima, sem cookies
     Não guarda IP, nome nem identificador permanente. O código da
     visita é aleatório e some ao fechar a aba.
     ============================================================ */
  if (C.coletor && !admin && !emIframe) (function () {
    function rid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }
    var pv = rid(), sid = pv;
    try { sid = sessionStorage.getItem('cc_sid') || rid(); sessionStorage.setItem('cc_sid', sid); } catch (e) {}
    var dev = window.innerWidth < 720 ? 'm' : 'd';
    var fila = [], t0 = Date.now(), maxSc = 0, secs = { hero: 1 };

    function add(o) { o.pv = pv; o.sid = sid; o.d = dev; fila.push(o); }
    function enviar() {
      if (!fila.length) return;
      var corpo = JSON.stringify(fila.splice(0, fila.length));
      try { if (navigator.sendBeacon && navigator.sendBeacon(C.coletor, corpo)) return; } catch (e) {}
      try { fetch(C.coletor, { method: 'POST', body: corpo, mode: 'no-cors', keepalive: true }); } catch (e) {}
    }

    // visita + origem
    var ref = '';
    try {
      if (document.referrer) {
        var h = new URL(document.referrer).hostname.replace(/^www\./, '');
        if (h && h !== location.hostname.replace(/^www\./, '')) ref = h;
      }
    } catch (e) {}
    add({ t: 'v', o: (params && params.get('utm_source')) || ref || '', cp: (params && params.get('utm_campaign')) || '' });
    enviar();

    // rolagem: até onde a pessoa viu (parte de baixo da tela)
    function medirRolagem() {
      var h = document.documentElement.scrollHeight;
      if (h > 0) maxSc = Math.max(maxSc, Math.min(100, (window.scrollY + window.innerHeight) / h * 100));
    }
    medirRolagem();
    window.addEventListener('scroll', medirRolagem, { passive: true });

    // blocos vistos
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (e) { if (e.isIntersecting) { secs[e.target.id] = 1; io.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -50% 0px' });
      [].forEach.call(document.querySelectorAll('section[id]'), function (s) { io.observe(s); });
    }

    // toques e cliques (posição relativa ao bloco, pro mapa de calor)
    function zonaDe(el) { return el.closest('.tarja, .fixo, .cookie, section[id], header.hero, footer.rodape'); }
    function nomeZona(z) {
      if (!z) return 'fora';
      if (z.id) return z.id;
      var c = z.classList;
      return c.contains('tarja') ? 'tarja' : c.contains('fixo') ? 'fixo' : c.contains('cookie') ? 'cookie'
        : c.contains('hero') ? 'hero' : c.contains('rodape') ? 'rodape' : 'fora';
    }
    function tipoAlvo(el) {
      if (el.closest('a[href*="pay.kiwify.com.br"]')) return 'comprar';
      if (el.closest('#vsl-som')) return 'video';
      if (el.closest('a.btn[href="#oferta"]')) return 'ver-oferta';
      if (el.closest('.faq summary')) return 'pergunta';
      if (el.closest('a')) return 'link';
      if (el.closest('button')) return 'botao';
      if (el.closest('img, .capa, .retrato, .dep__foto')) return 'imagem';
      return 'texto';
    }
    var faqs = [].slice.call(document.querySelectorAll('.faq details'));
    document.addEventListener('click', function (ev) {
      var el = ev.target;
      if (!el || !el.closest) return;
      var z = zonaDe(el), nome = nomeZona(z), alvo = tipoAlvo(el), o = { t: 'c', z: nome, a: alvo };
      if (z && !/^(tarja|fixo|cookie|fora)$/.test(nome)) {
        var r = z.getBoundingClientRect();
        if (r.width && r.height) {
          o.x = (ev.clientX - r.left) / r.width * 100;
          o.y = (ev.clientY - r.top) / r.height * 100;
        }
      }
      add(o);
      if (nome !== 'fora' && nome !== 'tarja' && nome !== 'fixo' && nome !== 'cookie') secs[nome] = 1;
      if (alvo === 'comprar') {
        var lk = el.closest('a[href*="pay.kiwify.com.br"]');
        add({ t: 'b', a: localDoBotao(lk) });
        resumo();
      } else if (alvo === 'video') {
        add({ t: 'p' });
        enviar();
      } else if (alvo === 'pergunta') {
        var d = el.closest('details');
        if (d && !d.open) add({ t: 'f', a: String(faqs.indexOf(d) + 1) });
      }
    }, true);

    // resumo da visita: tempo, rolagem e blocos vistos
    function resumo() {
      medirRolagem();
      // Blocos vistos também pela profundidade máxima: não depende só do detector
      // de blocos, que alguns navegadores embutidos seguram em segundo plano.
      try {
        var fundo = maxSc / 100 * document.documentElement.scrollHeight - window.innerHeight / 2;
        [].forEach.call(document.querySelectorAll('section[id]'), function (s) {
          if (s.getBoundingClientRect().top + window.scrollY < fundo) secs[s.id] = 1;
        });
      } catch (e) {}
      add({ t: 'l', a: Object.keys(secs).join(','), ms: Date.now() - t0, sc: maxSc });
      enviar();
    }
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') resumo(); });
    window.addEventListener('pagehide', resumo);
    setInterval(enviar, 15000);
  })();

  /* ============================================================
     2) GOOGLE ANALYTICS 4 + MICROSOFT CLARITY (com consentimento)
     ============================================================ */
  function track(nome, dados) {
    dados = dados || {};
    try { if (window.gtag) window.gtag('event', nome, dados); } catch (e) {}
    try {
      if (window.clarity) {
        var det = dados.local || dados.secao || dados.percentual;
        window.clarity('event', det ? nome + '_' + det : nome);
      }
    } catch (e) {}
  }
  window.ccTrack = track;

  function carregar() {
    if (C.ga4) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', C.ga4);
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(C.ga4);
      document.head.appendChild(s);
    }
    if (C.clarity) {
      (function (c, l, a, r, i, t, y) {
        c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
        t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
        y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
      })(window, document, 'clarity', 'script', C.clarity);
    }
  }

  function mostrarAviso() {
    var st = document.createElement('style');
    st.textContent =
      '.cookie{position:fixed;left:12px;right:12px;bottom:12px;z-index:70;max-width:560px;margin:0 auto;background:#1B2420;color:#F1F2EA;border-radius:10px;padding:14px 16px;box-shadow:0 12px 30px rgba(0,0,0,.35);font-size:14px;line-height:1.45;display:grid;gap:10px}' +
      '.cookie p{margin:0}.cookie a{color:#F7E8B8}' +
      '.cookie__acoes{display:flex;gap:8px;justify-content:flex-end}' +
      '.cookie button{font:inherit;font-weight:700;border-radius:6px;padding:10px 16px;cursor:pointer}' +
      '.cookie__nao{background:transparent;color:#F1F2EA;border:1px solid rgba(255,255,255,.35)}' +
      '.cookie__sim{background:#179A45;color:#fff;border:0}' +
      'body.tem-cookie .fixo{display:none}';
    document.head.appendChild(st);
    var b = document.createElement('div');
    b.className = 'cookie';
    b.setAttribute('role', 'dialog');
    b.setAttribute('aria-label', 'Aviso de cookies');
    b.innerHTML = '<p>Usamos cookies pra entender como as pessoas usam o site e melhorar a página. Saiba mais na <a href="privacidade.html">Política de Privacidade</a>.</p>' +
      '<div class="cookie__acoes"><button type="button" class="cookie__nao">Recusar</button><button type="button" class="cookie__sim">Aceitar</button></div>';
    document.body.appendChild(b);
    document.body.classList.add('tem-cookie');
    function fechar(v) {
      try { localStorage.setItem('cc_consent', v); } catch (e) {}
      b.remove();
      document.body.classList.remove('tem-cookie');
    }
    b.querySelector('.cookie__sim').addEventListener('click', function () { fechar('sim'); carregar(); });
    b.querySelector('.cookie__nao').addEventListener('click', function () { fechar('nao'); });
  }

  if ((C.ga4 || C.clarity) && !admin && !emIframe) {
    var escolha = null;
    try { escolha = localStorage.getItem('cc_consent'); } catch (e) {}
    if (escolha === 'sim') carregar();
    else if (escolha !== 'nao') mostrarAviso();
  }

  // Eventos pro Google Analytics e Clarity (só chegam se a pessoa aceitou)
  links.forEach(function (a) {
    a.addEventListener('click', function () {
      var local = localDoBotao(a);
      track('clique_comprar', { local: local });
      try { if (window.gtag) window.gtag('event', 'begin_checkout', { local: local, currency: 'BRL', value: 47 }); } catch (e) {}
    });
  });
  var tarja = document.querySelector('.tarja');
  if (tarja) tarja.addEventListener('click', function () { track('clique_tarja'); });
  var som = document.getElementById('vsl-som');
  if (som) som.addEventListener('click', function () { track('vsl_play_com_som'); });
  [].forEach.call(document.querySelectorAll('.faq details'), function (d, i) {
    var s = d.querySelector('summary');
    if (!s) return;
    s.addEventListener('click', function () {
      if (!d.open) track('faq_abrir', { pergunta: s.textContent.trim().slice(0, 90) || 'p' + (i + 1) });
    });
  });
  if ('IntersectionObserver' in window) {
    var vistos = {};
    var io2 = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) {
        var id = e.target.id;
        if (e.isIntersecting && !vistos[id]) { vistos[id] = 1; track('secao_vista', { secao: id }); io2.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -50% 0px' });
    [].forEach.call(document.querySelectorAll('section[id]'), function (s) { io2.observe(s); });
  }
  var marcos = [25, 50, 75, 90], feitos = {};
  window.addEventListener('scroll', function () {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (h <= 0) return;
    var pct = (window.scrollY / h) * 100;
    marcos.forEach(function (m) { if (pct >= m && !feitos[m]) { feitos[m] = 1; track('rolagem', { percentual: m }); } });
  }, { passive: true });
})();
