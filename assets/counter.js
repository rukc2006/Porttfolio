/* Свой счётчик визитов: без cookies, без личных данных, не работает при включённом Do Not Track. Данные идут в Таблицу владелицы.
   Клик: если у ссылки data-track непустой, в счётчик пишется это имя (например «контакты-шапка»), иначе адрес. utm первого касания хранится и уходит в каждом событии, utm из адреса переносятся на внутренние ссылки. */
(function () {
  if (navigator.doNotTrack === '1') return;
  try { if (location.search.indexOf('nocount=1') > -1) localStorage.setItem('kc_ignore', '1'); if (localStorage.getItem('kc_ignore') === '1') return; } catch (e) {}
  var U = 'https://script.google.com/macros/s/AKfycbxWan8OxqSeTzXon7ekzAIiOmTNcXmWjdGlkmxICi0umcYt91ZKAQsa2E3Go5ferXO7/exec';
  var vid = ''; try { vid = localStorage.getItem('kc_vid') || ''; if (!vid) { vid = Math.random().toString(36).slice(2, 12) + Date.now().toString(36).slice(-4); localStorage.setItem('kc_vid', vid); } } catch (e) {}
  var utm = (location.search.match(/utm_[a-z]+=[^&]+/g) || []).join('&');
  try { if (utm) localStorage.setItem('kc_utm', utm); else utm = localStorage.getItem('kc_utm') || ''; } catch (e) {}
  // переносим utm на внутренние ссылки
  if (utm) {
    var links = document.querySelectorAll('a[href]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i], h = a.getAttribute('href');
      if (!h || /^(#|mailto:|tel:|https?:|javascript:)/i.test(h) || /\.(pdf|png|jpe?g|webp|zip)(\?|#|$)/i.test(h)) continue;
      if (h.indexOf('utm_') > -1) continue;
      var hash = '', k = h.indexOf('#'); if (k > -1) { hash = h.slice(k); h = h.slice(0, k); }
      a.setAttribute('href', h + (h.indexOf('?') > -1 ? '&' : '?') + utm + hash);
    }
  }
  function send(ev, target) {
    try {
      var ref = ''; try { ref = document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) {}
      var q = 'a=hit&p=' + encodeURIComponent((location.pathname.split('/').pop() || 'index')) +
        '&e=' + ev + '&t=' + encodeURIComponent((target || '').slice(0, 120)) +
        '&r=' + encodeURIComponent(ref) + '&w=' + innerWidth + '&l=' + encodeURIComponent(navigator.language || '') +
        '&u=' + encodeURIComponent(utm.replace(/&/g, '|').slice(0, 120));
      fetch(U + '?' + q + '&v=' + encodeURIComponent(vid), { mode: 'no-cors', keepalive: true });
    } catch (e) {}
  }
  send('view', '');
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href]');
    if (!a) return;
    var name = a.getAttribute('data-track');
    if (name || a.host !== location.host) send('click', name || a.href.replace(/^https?:\/\//, '').replace(/\?.*$/, ''));
  }, true);
})();
