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
