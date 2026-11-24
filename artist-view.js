const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');

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

// Artwork interactions: a tactile compare slider, a magnifying glass bubble,
// and a small card-swap carousel. All controls remain usable by touch/keyboard.
document.querySelectorAll('[data-compare]').forEach((stage) => {
  const range = stage.querySelector('input[type="range"]');
  range?.addEventListener('input', () => stage.style.setProperty('--compare', `${range.value}%`));
});

document.querySelectorAll('[data-glass]').forEach((stage) => {
  const image = stage.querySelector('img');
  const lens = stage.querySelector('.glass-lens');
  if (!image || !lens) return;
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
  const cards = [...stack.querySelectorAll('.swap-art')];
  const count = stack.parentElement.querySelector('[data-swap-count]');
  let front = 0;
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
  cards.forEach((card, i) => card.addEventListener('click', () => render((i - front + cards.length) % cards.length || 1)));
  stack.parentElement.querySelector('[data-swap-prev]')?.addEventListener('click', () => render(-1));
  stack.parentElement.querySelector('[data-swap-next]')?.addEventListener('click', () => render(1));
  render();
});
