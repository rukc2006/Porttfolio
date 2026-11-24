(() => {
  'use strict';
  if (!('IntersectionObserver' in window)) return;
  const targets = document.querySelectorAll('.mk-card,.tile,.work,.ex-card,.study-card,.practice-route,.art-th,.guide-card,.gift-card,.feature-card,.price-card,.faq-item,.cvb');
  if (!targets.length) return;
  const style = document.createElement('style');
  style.textContent = '.site-reveal{opacity:0;transform:translateY(14px);transition:opacity .5s ease,transform .5s cubic-bezier(.2,.7,.2,1)}.site-reveal.is-visible{opacity:1;transform:none}@media(prefers-reduced-motion:reduce){.site-reveal{opacity:1;transform:none;transition:none}}@media print{.site-reveal{opacity:1;transform:none;transition:none}}@media(hover:hover){.button,.nav-cta,.top-cta{transition:transform .18s ease,filter .18s ease}.button:active,.nav-cta:active,.top-cta:active{transform:scale(.98)}}';
  document.head.appendChild(style);
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    observer.unobserve(entry.target);
  }), { threshold: 0.08, rootMargin: '0px 0px -28px 0px' });
  targets.forEach((element, index) => {
    element.classList.add('site-reveal');
    element.style.transitionDelay = `${Math.min(index % 5, 4) * 45}ms`;
    observer.observe(element);
  });
})();
