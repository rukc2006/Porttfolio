(() => {
  'use strict';
  document.querySelectorAll('[data-artist-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      const name = button.dataset.artistMode;
      if (window.parent !== window) {
        window.parent.postMessage({ type: 'artist-tab-select', name }, location.origin);
      } else {
        location.href = `artist.html#${name === 'cv' ? 'cv' : 'view'}`;
      }
    });
  });
})();
