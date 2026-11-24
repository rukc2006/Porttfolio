(function () {
  'use strict';

  var labels = {
    pers: 'Персональные',
    intl: 'Международные',
    onl: 'Онлайн-выставки',
    auc: 'Аукционы',
    exh: 'Выставки',
    cmp: 'Конкурсы',
    mkt: 'Маркеты'
  };
  var views = [
    { root: 'exCards', menu: 'exMenu', timeline: 'exYears' },
    { root: 'exhibitionCards', menu: 'exFilter', timeline: 'exYears' },
    { root: 'cvExhibitions', mode: 'years' }
  ];
  var states = {};
  var items = [];

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function tr(value) {
    return typeof window.kcT === 'function' ? window.kcT(value) : value;
  }

  function validType(value) {
    return Object.prototype.hasOwnProperty.call(labels, value) ? value : 'exh';
  }

  function filteredEvents(state) {
    return items.filter(function (item) {
      return (state.type === 'all' || validType(item.type) === state.type)
        && (state.year === 'all' || String(item.year) === state.year);
    });
  }

  function eventCard(item) {
    var type = validType(item.type);
    var place = item.place ? ' · ' + tr(item.place) : '';
    return '<article class="ex-card compact ex-t-' + type + ' t-' + type + ' x-' + type + '" data-k="' + type + '" data-y="' + Number(item.year) + '">'
      + '<div class="ex-meta">' + esc(item.year) + esc(place) + '</div>'
      + '<h3>' + esc(tr(item.title)) + '</h3>'
      + '<p>' + esc(tr(item.detail || '')) + '</p>'
      + (item.note ? '<p class="ex-note">' + esc(tr(item.note)) + '</p>' : '')
      + (item.url ? '<a class="button" href="' + esc(item.url) + '" target="_blank" rel="noopener">' + esc(tr('Подробнее →')) + '</a>' : '')
      + '</article>';
  }

  function eventExplorer(view, root) {
    var state = states[view.root];
    var visible = filteredEvents(state);
    var output = document.querySelector('.ex-timeline [data-ex-count]');
    if (output) {
      var yearLabel = state.year === 'all' ? tr('Все годы') : state.year;
      output.textContent = yearLabel + ' · ' + visible.length + ' ' + tr('событий');
    }
    if (!visible.length) {
      root.innerHTML = '<div class="ex-explorer-empty">' + esc(tr('Для этого фильтра событий нет.')) + '</div>';
      return;
    }

    var active = visible.find(function (item) { return item._id === state.selectedId; }) || visible[0];
    state.selectedId = active._id;
    root.innerHTML = '<div class="ex-event-timeline" tabindex="0" aria-label="' + esc(tr('Интерактивная хронология выставок')) + '">'
      + visible.map(function (item, index) {
        var type = validType(item.type);
        var isOpen = item._id === active._id;
        return '<details class="ex-event-step ex-event-' + type + '" data-event-id="' + item._id + '"' + (isOpen ? ' open' : '') + '>'
          + '<summary><span class="ex-event-step-meta"><span class="ex-event-step-year">' + esc(item.year) + '</span><span class="ex-event-step-place">' + esc(item.place ? tr(item.place) : '') + '</span><span class="ex-event-step-type">' + esc(tr(labels[type])) + '</span></span>'
          + '<span class="ex-event-step-title">' + esc(tr(item.title)) + '</span>'
          + '<span class="ex-event-step-index">' + String(index + 1).padStart(2, '0') + ' / ' + String(visible.length).padStart(2, '0') + '</span></summary>'
          + '<div class="ex-event-step-body"><p>' + esc(tr(item.detail || '')) + '</p>'
          + (item.note ? '<p class="ex-event-step-note">' + esc(tr(item.note)) + '</p>' : '')
          + (item.url ? '<a href="' + esc(item.url) + '" target="_blank" rel="noopener">' + esc(tr('Посмотреть публикацию ↗')) + '</a>' : '')
          + '</div></details>';
      }).join('') + '</div>';
  }

  function yearList(list) {
    var years = {};
    list.forEach(function (item) { (years[item.year] || (years[item.year] = [])).push(item); });
    return Object.keys(years).sort(function (a, b) { return Number(b) - Number(a); }).map(function (year) {
      return '<section class="cv-ex-y" aria-label="' + esc(year) + '"><h3>' + esc(year) + '</h3><ul>'
        + years[year].map(function (item) {
          var type = validType(item.type);
          return '<li class="x-' + type + '"><strong>' + esc(tr(item.title)) + '</strong>'
            + (item.detail ? '<span class="ex-w">' + esc(tr(item.detail)) + '</span>' : '')
            + (item.url ? '<a class="cv-ex-link" href="' + esc(item.url) + '" target="_blank" rel="noopener">' + esc(tr('Открыть материал ↗')) + '</a>' : '')
            + '</li>';
        }).join('') + '</ul></section>';
    }).join('');
  }

  function updateCount(view, state) {
    var timeline = document.getElementById(view.timeline);
    if (!timeline) return;
    var count = filteredEvents(state).length;
    var year = state.year === 'all' ? tr('Все годы') : state.year;
    var output = document.querySelector('.ex-timeline [data-ex-count]');
    if (output) output.textContent = year + ' · ' + count + ' ' + tr('событий');
  }

  function makeYearButtons(view, root) {
    var years = {};
    items.forEach(function (item) { years[item.year] = (years[item.year] || 0) + 1; });
    var timeline = document.getElementById(view.timeline);
    if (!timeline) return;
    timeline.innerHTML = '<button type="button" data-y="all" aria-pressed="true">' + esc(tr('Все годы')) + ' · ' + items.length + '</button>'
      + Object.keys(years).sort(function (a, b) { return Number(a) - Number(b); }).map(function (year) {
        return '<button type="button" data-y="' + esc(year) + '" aria-pressed="false">' + esc(year) + ' · ' + years[year] + '</button>';
      }).join('');
    timeline.onclick = function (event) {
      var button = event.target.closest('button[data-y]');
      if (!button) return;
      states[view.root].year = button.dataset.y;
      timeline.querySelectorAll('button').forEach(function (item) { item.setAttribute('aria-pressed', String(item === button)); });
      applyFilter(view, root);
    };
  }

  function setupExplorer(view, root) {
    if (root.dataset.explorerReady) return;
    root.dataset.explorerReady = 'true';
    root.addEventListener('click', function (event) {
      var state = states[view.root];
      var summary = event.target.closest('.ex-event-step > summary');
      if (summary) state.selectedId = Number(summary.parentElement.dataset.eventId);
    });
    root.addEventListener('toggle', function (event) {
      if (!event.target.matches('.ex-event-step') || !event.target.open) return;
      root.querySelectorAll('.ex-event-step[open]').forEach(function (step) {
        if (step !== event.target) step.open = false;
      });
      states[view.root].selectedId = Number(event.target.dataset.eventId);
    }, true);
  }

  function applyFilter(view, root) {
    var state = states[view.root];
    if (root.closest('.exhibitions-interactive')) {
      eventExplorer(view, root);
      return;
    }
    var visible = 0;
    root.querySelectorAll('.ex-card[data-k]').forEach(function (card) {
      var show = (state.type === 'all' || card.dataset.k === state.type)
        && (state.year === 'all' || card.dataset.y === state.year);
      card.hidden = !show;
      if (show) visible++;
    });
    updateCount(view, state);
  }

  function render() {
    views.forEach(function (view) {
      var root = document.getElementById(view.root);
      var menu = view.menu && document.getElementById(view.menu);
      if (!root) return;
      if (!states[view.root]) states[view.root] = { type: 'all', year: 'all', selectedId: null };
      if (view.mode === 'years') {
        root.innerHTML = yearList(items);
        return;
      }
      var explorer = root.closest('.exhibitions-interactive');
      root.innerHTML = explorer ? '' : items.map(eventCard).join('');
      if (explorer) setupExplorer(view, root);
      if (menu) {
        menu.innerHTML = '<button type="button" class="ex-all on" data-f="all" aria-pressed="true">' + esc(tr('Все')) + ' · ' + items.length + '</button>'
          + Object.keys(labels).filter(function (key) { return items.some(function (item) { return validType(item.type) === key; }); }).map(function (key) {
            return '<button type="button" class="ex-t-' + key + ' lg-' + key + ' x-' + key + '" data-f="' + key + '" aria-pressed="false">'
              + esc(tr(labels[key])) + ' · ' + items.filter(function (item) { return validType(item.type) === key; }).length + '</button>';
          }).join('');
        menu.onclick = function (event) {
          var button = event.target.closest('button[data-f]');
          if (!button) return;
          states[view.root].type = button.dataset.f;
          menu.querySelectorAll('button[data-f]').forEach(function (item) {
            item.classList.toggle('on', item === button);
            item.setAttribute('aria-pressed', String(item === button));
          });
          applyFilter(view, root);
        };
      }
      if (view.timeline) makeYearButtons(view, root);
      applyFilter(view, root);
    });
    document.dispatchEvent(new Event('exhibitions:ready'));
  }

  fetch('exhibitions.json?v=20261125-timeline-v1')
    .then(function (response) { if (!response.ok) throw Error('load'); return response.json(); })
    .then(function (data) {
      items = data.slice().sort(function (a, b) { return Number(b.year) - Number(a.year); });
      items.forEach(function (item, index) { item._id = index; });
      render();
    })
    .catch(function () {
      views.forEach(function (view) {
        var root = document.getElementById(view.root);
        if (root) root.textContent = tr('Список выставок временно не загрузился.');
      });
      document.dispatchEvent(new Event('exhibitions:ready'));
    });
  document.addEventListener('kc:language-change', function () { if (items.length) render(); });
})();
