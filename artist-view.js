const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');

window.addEventListener('message', (event) => {
  if (event.origin !== location.origin || event.data?.type !== 'kc-scroll-exhibitions') return;
  document.querySelector('#exhibitions')?.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start'
  });
});

menuButton?.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!expanded));
  nav?.classList.toggle('open', !expanded);
});

nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menuButton?.setAttribute('aria-expanded', 'false');
}));

const artDialog = document.querySelector('.art-dialog');
const artDialogImage = artDialog?.querySelector('.dialog-image');
const artDialogTitle = artDialog?.querySelector('#art-dialog-title');
const artDialogClose = artDialog?.querySelector('.dialog-close');

document.querySelectorAll('.artwork-slide:not([aria-hidden="true"])').forEach((slide) => {
  slide.addEventListener('click', () => {
    if (!artDialog || !artDialogImage || !artDialogTitle) return;
    artDialogImage.src = slide.dataset.artSrc;
    artDialogImage.alt = slide.querySelector('img')?.alt || slide.dataset.artName || 'Живописная работа';
    artDialogTitle.textContent = slide.dataset.artName || 'Живописная работа';
    artDialog.showModal();
  });
});

artDialogClose?.addEventListener('click', () => artDialog?.close());
artDialog?.addEventListener('click', (event) => {
  if (event.target === artDialog) artDialog.close();
});

// Compare any two paintings from the page, then move the divider to inspect them.
document.querySelectorAll('[data-compare]').forEach((stage) => {
  const range = stage.querySelector('input[type="range"]');
  const selects = [...document.querySelectorAll('[data-compare-layer]')];
  const base = stage.querySelector(':scope > img');
  const top = stage.querySelector('.compare-top img');
  const baseLabel = stage.querySelector('.compare-label-a');
  const topLabel = stage.querySelector('.compare-label-b');
  const note = stage.parentElement.querySelector('[data-compare-description]') || stage.nextElementSibling;
  const current = { base: base?.getAttribute('src'), top: top?.getAttribute('src') };
  const choices = new Map();
  const clean = (value) => (value || '').replace(/\s+/g, ' ').trim();
  const sourceName = (node, image) => {
    const button = node.matches('button') ? node : node.closest('button');
    const named = button?.dataset.artName || button?.dataset.name;
    if (named) return clean(named);
    const card = node.closest?.('.study-card');
    const title = node.querySelector?.('h3')?.getAttribute('data-ru') || node.querySelector?.('h3')?.textContent
      || card?.querySelector('h3')?.getAttribute('data-ru') || card?.querySelector('h3')?.textContent;
    if (title) return clean(title.replace(/<[^>]+>/g, ' '));
    return clean(image.getAttribute('data-ru-alt') || image.alt || image.getAttribute('src').split('/').pop().replace(/[-_]/g, ' ').replace(/\.[^.]+$/, ''));
  };
  const gatherChoices = () => {
    document.querySelectorAll('.artwork-slide, .swap-art, .study-art').forEach((node) => {
      const image = node.matches('img') ? node : node.querySelector('img');
      if (!image) return;
      const src = image.getAttribute('src');
      if (!src || choices.has(src)) return;
      choices.set(src, { src, name: sourceName(node, image) });
    });
    [base, top].filter(Boolean).forEach((image) => {
      const src = image.getAttribute('src');
      if (src && !choices.has(src)) choices.set(src, { src, name: sourceName(image, image) });
    });
  };
  const translatedName = (name) => typeof window.kcT === 'function' ? window.kcT(name) : name;
  const updateLayer = (select, image, label) => {
    const choice = choices.get(select.value);
    if (!choice || !image) return;
    image.src = choice.src;
    image.alt = translatedName(choice.name);
    if (label) label.textContent = translatedName(choice.name).toUpperCase();
  };
  const buildPickers = () => {
    if (!choices.size) gatherChoices();
    selects.forEach((select) => {
      const layer = select.dataset.compareLayer;
      const wanted = current[layer] || select.value;
      select.replaceChildren(...[...choices.values()].map((choice) => {
        const option = document.createElement('option');
        option.value = choice.src;
        option.textContent = translatedName(choice.name);
        return option;
      }));
      if (choices.has(wanted)) select.value = wanted;
      const image = layer === 'base' ? base : top;
      const label = layer === 'base' ? baseLabel : topLabel;
      updateLayer(select, image, label);
      select.onchange = () => {
        current[layer] = select.value;
        updateLayer(select, image, label);
      };
    });
    if (note) note.textContent = translatedName('Выберите любые две работы и двигайте границу, чтобы сравнить их цвет и фактуру.');
  };
  range?.addEventListener('input', () => stage.style.setProperty('--compare', `${range.value}%`));
  document.addEventListener('kc:language-change', buildPickers);
  if (window.kcT) buildPickers();
});

// Let visitors test the palette by applying a chosen color to the reproduction.
document.querySelectorAll('.study-card').forEach((card) => {
  const image = card.querySelector('.study-art');
  const palette = card.querySelector('.palette');
  if (!image || !palette || palette.dataset.colorPlayReady) return;
  palette.dataset.colorPlayReady = 'true';

  const frame = document.createElement('div');
  frame.className = 'study-art-frame';
  image.parentNode.insertBefore(frame, image);
  frame.appendChild(image);
  const tint = document.createElement('span');
  tint.className = 'study-art-tint';
  tint.setAttribute('aria-hidden', 'true');
  frame.appendChild(tint);

  const feedback = document.createElement('p');
  feedback.className = 'palette-feedback';
  feedback.setAttribute('aria-live', 'polite');
  feedback.textContent = 'Клик по цвету изменит тон картины; повторный клик сбросит эффект.';
  palette.insertAdjacentElement('afterend', feedback);

  const samples = [...palette.querySelectorAll('.palette-sample')];
  const reset = () => {
    card.classList.remove('has-color-accent');
    card.style.removeProperty('--active-color');
    samples.forEach((sample) => sample.setAttribute('aria-pressed', 'false'));
    feedback.textContent = typeof window.kcT === 'function'
      ? window.kcT('Клик по цвету изменит тон картины; повторный клик сбросит эффект.')
      : 'Клик по цвету изменит тон картины; повторный клик сбросит эффект.';
  };
  const activate = (sample) => {
    const chip = sample.querySelector('i');
    const name = sample.querySelector('span')?.textContent.trim() || '';
    const color = chip?.style.getPropertyValue('--swatch').trim();
    if (!color) return;
    if (sample.getAttribute('aria-pressed') === 'true') { reset(); return; }
    card.style.setProperty('--active-color', color);
    card.classList.add('has-color-accent');
    samples.forEach((item) => item.setAttribute('aria-pressed', String(item === sample)));
    feedback.textContent = (typeof window.kcT === 'function' ? window.kcT('Цветовой акцент:') : 'Цветовой акцент:')
      + ' ' + (typeof window.kcT === 'function' ? window.kcT(name) : name)
      + ' · ' + (typeof window.kcT === 'function' ? window.kcT('повторный клик сбросит оттенок') : 'повторный клик сбросит оттенок');
  };
  samples.forEach((sample) => {
    sample.setAttribute('aria-pressed', 'false');
    sample.addEventListener('click', () => activate(sample));
  });
  document.addEventListener('kc:language-change', () => {
    const active = samples.find((sample) => sample.getAttribute('aria-pressed') === 'true');
    if (!active) { reset(); return; }
    const name = active.querySelector('span')?.textContent.trim() || '';
    feedback.textContent = (typeof window.kcT === 'function' ? window.kcT('Цветовой акцент:') : 'Цветовой акцент:')
      + ' ' + (typeof window.kcT === 'function' ? window.kcT(name) : name)
      + ' · ' + (typeof window.kcT === 'function' ? window.kcT('повторный клик сбросит оттенок') : 'повторный клик сбросит оттенок');
  });
});

// Artwork interactions: a magnifying glass bubble and a card-swap carousel.

document.querySelectorAll('[data-glass]').forEach((stage) => {
  const image = stage.querySelector('img');
  const lens = stage.querySelector('.glass-lens');
  const picker = stage.parentElement.querySelector('[data-glass-select]');
  if (!image || !lens) return;
  const buildChoices = () => {
    if (!picker) return;
    const current = image.getAttribute('src');
    const choices = new Map();
    const addChoice = (node) => {
      const art = node.matches('img') ? node : node.querySelector('img');
      if (!art) return;
      const src = art.getAttribute('src');
      if (!src) return;
      const button = node.matches('button') ? node : node.closest('button');
      const heading = node.closest('.study-card')?.querySelector('h3');
      const name = button?.dataset.artName || button?.dataset.name || heading?.getAttribute('data-ru') || heading?.textContent || art.getAttribute('data-ru-alt') || art.alt || src.split('/').pop();
      const cleanName = name.replace(/\s+/g, ' ').trim();
      const key = cleanName.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
      if (!choices.has(key)) choices.set(key, { src, name: cleanName });
    };
    // Prefer the larger study reproductions, then add paintings from the marquee
    // and carousel that are not already represented there.
    document.querySelectorAll('.study-art').forEach(addChoice);
    document.querySelectorAll('.artwork-slide').forEach(addChoice);
    document.querySelectorAll('.swap-art').forEach(addChoice);
    picker.replaceChildren(...[...choices.values()].map((choice) => {
      const option = document.createElement('option');
      option.value = choice.src;
      option.textContent = typeof window.kcT === 'function' ? window.kcT(choice.name) : choice.name;
      return option;
    }));
    const selectedChoice = [...choices.values()].find((choice) => choice.src === current) || choices.values().next().value;
    if (selectedChoice) {
      picker.value = selectedChoice.src;
      if (selectedChoice.src !== current) image.src = selectedChoice.src;
    }
    picker.onchange = () => {
      image.src = picker.value;
      image.alt = picker.selectedOptions[0]?.textContent || 'Картина';
      lens.style.backgroundImage = `url("${image.currentSrc || image.src}")`;
    };
  };
  document.addEventListener('kc:language-change', buildChoices);
  buildChoices();
  const update = (event) => {
    const rect = stage.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
    const px = x / rect.width * 100;
    const py = y / rect.height * 100;
    lens.style.left = `${px}%`;
    lens.style.top = `${py}%`;
    lens.style.backgroundImage = `url("${image.currentSrc || image.src}")`;
    lens.style.backgroundSize = `${rect.width * 2.45}px ${rect.height * 2.45}px`;
    lens.style.backgroundPosition = `${px}% ${py}%`;
    stage.classList.add('is-active');
  };
  stage.addEventListener('pointermove', update);
  stage.addEventListener('pointerleave', () => stage.classList.remove('is-active'));
  stage.addEventListener('focus', () => stage.classList.add('is-active'));
  stage.addEventListener('blur', () => stage.classList.remove('is-active'));
});

document.querySelectorAll('[data-swap]').forEach((stack) => {
  let cards = [...stack.querySelectorAll('.swap-art')];
  const count = stack.parentElement.querySelector('[data-swap-count]');
  let front = 0;
  let drag = null;
  let suppressClickUntil = 0;
  const render = (step = 0) => {
    front = (front + step + cards.length) % cards.length;
    cards.forEach((card, i) => {
      card.classList.remove('is-front', 'is-next', 'is-back');
      card.classList.add(i === front ? 'is-front' : i === (front + 1) % cards.length ? 'is-next' : 'is-back');
      card.setAttribute('aria-hidden', i === front ? 'false' : 'true');
      card.tabIndex = i === front ? 0 : -1;
    });
    if (count) count.textContent = `${String(front + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
  };
  cards.forEach((card) => {
    card.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary || event.button !== 0) return;
      drag = { card, id: event.pointerId, x: event.clientX, y: event.clientY, active: false };
    });
    card.addEventListener('click', (event) => {
      if (Date.now() < suppressClickUntil) { event.preventDefault(); event.stopPropagation(); return; }
      const index = cards.indexOf(card);
      render((index - front + cards.length) % cards.length || 1);
    });
  });
  window.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (!drag.active) {
      if (Math.hypot(dx, dy) < 9) return;
      if (event.pointerType === 'touch' && Math.abs(dy) > Math.abs(dx)) return;
      drag.active = true;
      drag.card.classList.add('is-dragging');
      stack.classList.add('is-reordering');
    }
    if (event.cancelable) event.preventDefault();
    drag.card.style.setProperty('--drag-x', `${dx}px`);
    drag.card.style.setProperty('--drag-y', `${dy - 8}px`);
    stack.querySelectorAll('.is-drop-target').forEach((card) => card.classList.remove('is-drop-target'));
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('.swap-art');
    if (target && target !== drag.card && target.parentElement === stack) target.classList.add('is-drop-target');
  }, { passive: false });
  window.addEventListener('pointerup', (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const state = drag;
    if (state.active) {
      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('.swap-art');
      if (target && target !== state.card && target.parentElement === stack) {
        const rect = target.getBoundingClientRect();
        const after = event.clientX > rect.left + rect.width / 2;
        stack.insertBefore(state.card, after ? target.nextSibling : target);
        cards = [...stack.querySelectorAll('.swap-art')];
        front = cards.indexOf(state.card);
        render();
      }
      suppressClickUntil = Date.now() + 500;
    }
    stack.querySelectorAll('.is-drop-target').forEach((card) => card.classList.remove('is-drop-target'));
    state.card.classList.remove('is-dragging');
    state.card.style.removeProperty('--drag-x');
    state.card.style.removeProperty('--drag-y');
    stack.classList.remove('is-reordering');
    drag = null;
  });
  window.addEventListener('pointercancel', () => {
    if (!drag) return;
    drag.card.classList.remove('is-dragging');
    drag.card.style.removeProperty('--drag-x');
    drag.card.style.removeProperty('--drag-y');
    stack.querySelectorAll('.is-drop-target').forEach((card) => card.classList.remove('is-drop-target'));
    stack.classList.remove('is-reordering');
    drag = null;
  });
  stack.parentElement.querySelector('[data-swap-prev]')?.addEventListener('click', () => render(-1));
  stack.parentElement.querySelector('[data-swap-next]')?.addEventListener('click', () => render(1));
  render();
});
