/* Переключатель языков RU / EN / 中文 для всех страниц.
   Русский текст остаётся в HTML. Переводы лежат в assets/i18n/en.json и zh.json в виде {"русский текст блока": "перевод"}.
   Ключ = innerHTML блока с пробелами, сжатыми до одного. Если перевода нет, остаётся русский.
   Режим сбора строк: открыть страницу с ?lang=dump, список ключей окажется в <pre id="i18n-dump">. */
(function () {
  'use strict';
  var LANGS = [['ru', 'RU'], ['en', 'EN'], ['zh', '中文']];
  var script = document.currentScript || document.querySelector('script[src*="i18n.js"]');
  var BASE = script ? script.src.replace(/i18n\.js(\?.*)?$/, '') : 'assets/';
  var INLINE = { A: 1, B: 1, I: 1, EM: 1, STRONG: 1, SPAN: 1, SMALL: 1, BR: 1, SUP: 1, SUB: 1, U: 1, CODE: 1, MARK: 1, S: 1, IMG: 1, WBR: 1 };
  var SKIP = { SCRIPT: 1, STYLE: 1, SVG: 1, TEXTAREA: 1, INPUT: 1, SELECT: 1, OPTION: 1, NOSCRIPT: 1, IFRAME: 1, CANVAS: 1, PRE: 1, CODE: 0 };
  var ATTRS = ['alt', 'title', 'placeholder', 'aria-label'];
  var dict = {}, lang = 'ru', applying = false, timer = null;

  function lookup(k) {
    if (dict[k]) return dict[k];
    var nums = k.match(/\d+/g);
    if (!nums) return null;
    var v = dict[k.replace(/\d+/g, '#')];
    if (!v) return null;
    var i = 0;
    return v.replace(/#/g, function () { return nums[i++] || ''; });
  }
  function norm(s) { return String(s).replace(/\s+/g, ' ').trim(); }
  function hasCyr(s) { return /[А-Яа-яЁё]/.test(s); }
  function getLang() {
    var m = location.search.match(/[?&]lang=(ru|en|zh|dump)/);
    if (m) { try { if (m[1] !== 'dump') localStorage.setItem('kc_lang', m[1]); } catch (e) {} return m[1]; }
    try { var l = localStorage.getItem('kc_lang'); if (l === 'en' || l === 'zh' || l === 'ru') return l; } catch (e) {}
    return 'ru';
  }
  function isSkipped(el) {
    if (SKIP[el.tagName]) return true;
    if (el.hasAttribute && (el.hasAttribute('data-i18n-skip') || el.id === 'i18n-dump' || (el.classList && el.classList.contains('lang-switch')))) return true;
    return false;
  }
  function isUnit(el) {
    if (!el.textContent || !el.textContent.trim()) return false;
    for (var i = 0; i < el.children.length; i++) { if (!INLINE[el.children[i].tagName]) return false; }
    return true;
  }
  // собираем блоки
  function collect(root, out) {
    if (root.nodeType !== 1 || isSkipped(root)) return;
    if (isUnit(root)) { out.push(root); return; }
    for (var n = root.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 1) collect(n, out);
      else if (n.nodeType === 3 && n.nodeValue.trim() && hasCyr(n.nodeValue)) out.push(n); // «голый» текст рядом с блоками
    }
  }
  function key(x) { return norm(x.nodeType === 3 ? x.nodeValue : x.innerHTML); }

  function applyAttrs(root, toRu) {
    var els = root.querySelectorAll ? root.querySelectorAll('[alt],[title],[placeholder],[aria-label]') : [];
    for (var i = 0; i < els.length; i++) {
      var e = els[i];
      ATTRS.forEach(function (a) {
        if (!e.hasAttribute(a)) return;
        var ru = e.getAttribute('data-ru-' + a);
        if (ru === null) { ru = e.getAttribute(a); if (!hasCyr(ru)) return; e.setAttribute('data-ru-' + a, ru); }
        var t = toRu ? ru : lookup(norm(ru));
        if (t) e.setAttribute(a, t); else if (toRu) e.setAttribute(a, ru);
      });
    }
  }
  function translateRoot(root) {
    var items = [];
    collect(root, items);
    applying = true;
    items.forEach(function (x) {
      if (x.nodeType === 3) {
        if (x._ru === undefined) x._ru = x.nodeValue;
        var t = lang === 'ru' ? null : lookup(norm(x._ru));
        x.nodeValue = t ? t : x._ru;
        return;
      }
      if (x.getAttribute('data-ru') === null) {
        var k0 = key(x);
        if (!hasCyr(k0)) return;
        x.setAttribute('data-ru', x.innerHTML);
      }
      var ru = x.getAttribute('data-ru');
      var t2 = lang === 'ru' ? null : lookup(norm(ru));
      var want = t2 ? t2 : ru;
      if (x.innerHTML !== want) x.innerHTML = want;
    });
    applyAttrs(root, lang === 'ru');
    applying = false;
  }
  function translateTitle() {
    if (!document.documentElement.hasAttribute('data-ru-title')) document.documentElement.setAttribute('data-ru-title', document.title);
    var ru = document.documentElement.getAttribute('data-ru-title');
    var t = lang === 'ru' ? null : lookup(norm(ru));
    document.title = t ? t : ru;
    var md = document.querySelector('meta[name="description"]');
    if (md) {
      if (!md.hasAttribute('data-ru')) md.setAttribute('data-ru', md.content);
      var rd = md.getAttribute('data-ru'), td = lang === 'ru' ? null : dict[norm(rd)];
      md.content = td ? td : rd;
    }
  }
  function fixLinks() {
    // PDF CV по языку
    var as = document.querySelectorAll('a[href*="Komarova_Ksenia_CV"]');
    for (var i = 0; i < as.length; i++) {
      var a = as[i], h = a.getAttribute('data-pdf');
      if (h === null) { h = a.getAttribute('href'); a.setAttribute('data-pdf', h); }
      a.setAttribute('href', lang === 'ru' ? h : h.replace(/Komarova_Ksenia_CV(_en|_zh)?\.pdf/, 'Komarova_Ksenia_CV_' + lang + '.pdf'));
    }
    // внутренние ссылки между страницами сохраняют язык через localStorage, параметр не нужен
  }
  function applyAll() {
    document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-CN' : lang);
    translateRoot(document.body);
    translateTitle();
    fixLinks();
    markSwitch();
  }
  function load(cb) {
    if (lang === 'ru' || lang === 'dump') { dict = {}; cb(); return; }
    var x = new XMLHttpRequest();
    x.open('GET', BASE + 'i18n/' + lang + '.json?v=20261011a', true);
    x.onload = function () { try { dict = JSON.parse(x.responseText) || {}; } catch (e) { dict = {}; } cb(); };
    x.onerror = function () { dict = {}; cb(); };
    x.send();
  }
  function setLang(l) {
    lang = l;
    try { localStorage.setItem('kc_lang', l); } catch (e) {}
    load(applyAll);
    try { var u = new URL(location.href); u.searchParams.delete('lang'); history.replaceState(null, '', u.toString()); } catch (e) {}
  }
  // переключатель
  function buildSwitch(cls) {
    var w = document.createElement('div');
    w.className = 'lang-switch ' + (cls || '');
    w.setAttribute('role', 'group'); w.setAttribute('aria-label', 'Language');
    LANGS.forEach(function (p) {
      var b = document.createElement('button');
      b.type = 'button'; b.dataset.l = p[0]; b.textContent = p[1];
      b.addEventListener('click', function () { setLang(p[0]); });
      w.appendChild(b);
    });
    return w;
  }
  function markSwitch() {
    var bs = document.querySelectorAll('.lang-switch button');
    for (var i = 0; i < bs.length; i++) bs[i].classList.toggle('on', bs[i].dataset.l === lang);
  }
  function injectSwitch() {
    var css = document.createElement('style');
    css.textContent = '.lang-switch{display:inline-flex;gap:2px;border:1px solid rgba(233,223,201,.35);border-radius:999px;padding:2px;margin-left:10px;vertical-align:middle;background:rgba(0,0,0,.18)}' +
      '.lang-switch button{font:600 12px/1 "Manrope",system-ui,sans-serif;letter-spacing:.04em;color:rgba(233,223,201,.75);background:transparent;border:0;border-radius:999px;padding:7px 10px;cursor:pointer}' +
      '.lang-switch button:hover{color:#fff}.lang-switch button.on{background:rgba(233,223,201,.9);color:#101710}' +
      '.lang-switch{flex:0 0 auto;white-space:nowrap}.lang-switch button{white-space:nowrap}.navlinks{gap:16px!important}.nav-more summary{white-space:nowrap}@media print{.lang-switch{display:none!important}}' +
      '.lang-switch.fixed{position:fixed;bottom:16px;right:16px;top:auto;z-index:60;margin:0;background:rgba(16,23,16,.92);box-shadow:0 4px 18px rgba(0,0,0,.4)}' +
      '.lang-switch.mob{margin:14px 0 0}' +
      'html[lang="zh-CN"] body,html[lang="zh-CN"] h1,html[lang="zh-CN"] h2,html[lang="zh-CN"] h3,html[lang="zh-CN"] button{font-family:"Manrope","PingFang SC","Microsoft YaHei","Noto Sans SC","Hiragino Sans GB",sans-serif!important;letter-spacing:0!important}' +
      'html[lang="zh-CN"] h1,html[lang="zh-CN"] h2,html[lang="zh-CN"] h3{text-transform:none!important;font-weight:500}' +
      '@media(max-width:900px){.lang-switch.nav{display:none}}';
    document.head.appendChild(css);
    var nl = document.querySelector('.navlinks');
    if (nl) nl.appendChild(buildSwitch('nav'));
    var mm = document.querySelector('.mobile-menu-inner, .mobile-menu');
    if (mm) mm.appendChild(buildSwitch('mob'));
    if (!nl && !mm) document.body.appendChild(buildSwitch('fixed'));
    else if (nl && !document.querySelector('.mobile-menu-inner, .mobile-menu')) document.body.appendChild(buildSwitch('fixed mobonly'));
    else if (!nl) {}
  }
  function observe() {
    if (!window.MutationObserver) return;
    new MutationObserver(function (muts) {
      if (applying || lang === 'ru') return;
      clearTimeout(timer);
      timer = setTimeout(function () { translateRoot(document.body); fixLinks(); }, 180);
    }).observe(document.body, { childList: true, subtree: true });
  }
  function dump() {
    var items = []; collect(document.body, items);
    var keys = {};
    items.forEach(function (x) { var k = key(x); if (hasCyr(k)) keys[k] = 1; });
    var as = document.querySelectorAll('[alt],[title],[placeholder],[aria-label]');
    for (var i = 0; i < as.length; i++) ATTRS.forEach(function (a) { var v = as[i].getAttribute(a); if (v && hasCyr(v)) keys[norm(v)] = 1; });
    if (hasCyr(document.title)) keys[norm(document.title)] = 1;
    var md = document.querySelector('meta[name="description"]'); if (md && hasCyr(md.content)) keys[norm(md.content)] = 1;
    var pre = document.createElement('pre'); pre.id = 'i18n-dump';
    pre.textContent = JSON.stringify(Object.keys(keys));
    document.body.appendChild(pre);
  }
  window.kcT = function (x) { return (lang === 'ru' || !x) ? x : (lookup(norm(x)) || x); };
  window.__i18nMissing = function () {
    var items = []; collect(document.body, items); var out = {};
    items.forEach(function (x) {
      var ru = x.nodeType === 3 ? (x._ru !== undefined ? x._ru : x.nodeValue) : (x.getAttribute('data-ru') !== null ? x.getAttribute('data-ru') : x.innerHTML);
      var k = norm(ru);
      if (!hasCyr(k)) return;
      if (lang === 'ru') return;
      if (!lookup(k)) out[k] = 1;
    });
    return Object.keys(out);
  };
  function init() {
    lang = getLang();
    injectSwitch();
    if (lang === 'dump') {
      // подождать динамический контент (манифест работ) и собрать ключи
      setTimeout(dump, 2500);
      return;
    }
    load(function () { applyAll(); observe(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
