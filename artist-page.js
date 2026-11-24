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


const artistTabs = [...document.querySelectorAll('[data-artist-tab]')];
const artistPanels = { view: document.getElementById('artist-panel-view'), cv: document.getElementById('artist-panel-cv') };
const cvFrame = document.getElementById('artist-cv-frame');
function selectArtistTab(name, updateHash = true) {
  if (!artistPanels[name]) return;
  artistTabs.forEach((tab) => { const active = tab.dataset.artistTab === name; tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1; });
  Object.entries(artistPanels).forEach(([key, panel]) => { panel.hidden = key !== name; });
  if (name === 'cv' && cvFrame && !cvFrame.dataset.loaded) { cvFrame.dataset.loaded = 'true'; cvFrame.src = 'cv.html?embed=artist'; }
  if (updateHash) history.replaceState(null, '', location.pathname + location.search + (name === 'cv' ? '#cv' : '#view'));
}
artistTabs.forEach((tab) => tab.addEventListener('click', () => selectArtistTab(tab.dataset.artistTab)));
artistTabs.forEach((tab) => tab.addEventListener('keydown', (event) => { if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return; event.preventDefault(); const i = artistTabs.indexOf(tab); const next = event.key === 'Home' ? 0 : event.key === 'End' ? artistTabs.length - 1 : (i + (event.key === 'ArrowRight' ? 1 : -1) + artistTabs.length) % artistTabs.length; artistTabs[next].focus(); selectArtistTab(artistTabs[next].dataset.artistTab); }));
window.addEventListener('hashchange', () => { if (location.hash === '#cv') selectArtistTab('cv', false); else if (location.hash === '#view') selectArtistTab('view', false); });
if (location.hash === '#cv') selectArtistTab('cv', false);
if (cvFrame) cvFrame.addEventListener('load', () => { try { const d = cvFrame.contentDocument; const style = d.createElement('style'); style.textContent = 'header.site, footer.site { display:none !important; } .cv-wrap { padding-top:28px !important; }'; d.head.appendChild(style); const resize = () => { cvFrame.style.height = Math.max(d.documentElement.scrollHeight, d.body.scrollHeight) + 'px'; }; resize(); setTimeout(resize, 700); setTimeout(resize, 1800); } catch (_) {} });

document.querySelectorAll('a[href="#practice"], a[href="#works"], a[href="#vision"], a[href="#contact"]').forEach((link) => link.addEventListener('click', () => { if (artistPanels.view.hidden) selectArtistTab('view', false); }));
