/* ============================================================
   ANÁLISE DO SITE — Google Analytics 4 + Microsoft Clarity
   - Os IDs ficam em assets/config.js. Sem ID, nada é carregado.
   - Só carrega depois que o visitante aceita o aviso de cookies (LGPD).
   - Aparelho do administrador (abriu o painel, ?admin ou ?editar) fica fora das estatísticas.
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

  /* ---------- origem do tráfego -> checkout ---------- */
  var links = [].slice.call(document.querySelectorAll('a[href*="pay.kiwify.com.br"]'));
  try {
    var p = new URLSearchParams(location.search), extra = [];
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'src', 'sck'].forEach(function (k) {
      var v = p.get(k); if (v) extra.push([k, v]);
    });
    if (extra.length) links.forEach(function (a) {
      var u = new URL(a.href);
      extra.forEach(function (kv) { if (!u.searchParams.has(kv[0])) u.searchParams.set(kv[0], kv[1]); });
      a.href = u.toString();
    });
  } catch (e) {}

  /* ---------- envio de eventos ---------- */
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

  /* ---------- carregar as ferramentas ---------- */
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

  /* ---------- aviso de cookies ---------- */
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

  /* ---------- eventos da página ---------- */
  // Botões de compra: qual botão foi clicado (video, plano, dentro, oferta, final, fixo)
  links.forEach(function (a) {
    a.addEventListener('click', function () {
      var sec = a.closest('section');
      var local = a.closest('.fixo') ? 'fixo' : (sec && sec.id) || 'outro';
      track('clique_comprar', { local: local });
      try { if (window.gtag) window.gtag('event', 'begin_checkout', { local: local, currency: 'BRL', value: 47 }); } catch (e) {}
    });
  });

  var tarja = document.querySelector('.tarja');
  if (tarja) tarja.addEventListener('click', function () { track('clique_tarja'); });

  var som = document.getElementById('vsl-som');
  if (som) som.addEventListener('click', function () { track('vsl_play_com_som'); });

  // Perguntas: só conta quando a pessoa abre (clique), não as que já vêm abertas
  [].forEach.call(document.querySelectorAll('.faq details'), function (d, i) {
    var s = d.querySelector('summary');
    if (!s) return;
    s.addEventListener('click', function () {
      if (!d.open) track('faq_abrir', { pergunta: s.textContent.trim().slice(0, 90) || 'p' + (i + 1) });
    });
  });

  // Blocos vistos: mostra até onde as pessoas chegam na página
  if ('IntersectionObserver' in window) {
    var vistos = {};
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) {
        var id = e.target.id;
        if (e.isIntersecting && !vistos[id]) {
          vistos[id] = 1;
          track('secao_vista', { secao: id });
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -50% 0px' });
    [].forEach.call(document.querySelectorAll('section[id]'), function (s) { io.observe(s); });
  }

  // Rolagem: 25%, 50%, 75% e 90% da página
  var marcos = [25, 50, 75, 90], feitos = {};
  window.addEventListener('scroll', function () {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (h <= 0) return;
    var pct = (window.scrollY / h) * 100;
    marcos.forEach(function (m) {
      if (pct >= m && !feitos[m]) { feitos[m] = 1; track('rolagem', { percentual: m }); }
    });
  }, { passive: true });
})();
