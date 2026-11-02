/* Shared interactions: theme, language, and homepage navigation. */
(() => {
  'use strict';

  const root = document.documentElement;
  const themeButtons = document.querySelectorAll('[data-theme-toggle]');
  const languageButtons = document.querySelectorAll('[data-lang]');

  // Theme selection persists across pages; system preference is the fallback.
  const storedTheme = localStorage.getItem('lndmr-theme');
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = ['dark', 'light'].includes(storedTheme)
    ? storedTheme
    : systemDark ? 'dark' : 'light';

  function updateThemeControls() {
    const isDark = root.dataset.theme === 'dark';
    themeButtons.forEach(button => {
      button.textContent = isDark ? '☼' : '☾';
      button.setAttribute('aria-label', isDark ? 'Use light theme' : 'Use dark theme');
    });
  }

  themeButtons.forEach(button => button.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('lndmr-theme', root.dataset.theme);
    updateThemeControls();
  }));
  updateThemeControls();

  // All translated strings are authored locally as data-en/data-de attributes.
  function applyLanguage(language) {
    const lang = language === 'de' ? 'de' : 'en';
    root.lang = lang;

    document.querySelectorAll('[data-en][data-de]').forEach(element => {
      // Preserve inline emphasis in the About paragraph when switching languages.
      if (element.hasAttribute('data-translate-emphasis') && lang === 'en') {
        element.innerHTML = element.dataset.en
          .replace('what works', '<em>what</em> works')
          .replace('but why.', 'but <em>why</em>.');
      } else {
        element.textContent = element.dataset[lang];
      }
    });

    languageButtons.forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.lang === lang));
    });

    const title = document.querySelector(`meta[name="page-title-${lang}"]`);
    if (title) document.title = title.content;
    localStorage.setItem('lndmr-lang', lang);
    document.dispatchEvent(new CustomEvent('portfolio:languagechange', { detail: { language: lang } }));
  }

  languageButtons.forEach(button => button.addEventListener('click', () => {
    applyLanguage(button.dataset.lang);
  }));
  applyLanguage(localStorage.getItem('lndmr-lang'));

  // Homepage-only project carousel. Other pages do not contain this element.
  const carousel = document.querySelector('[data-carousel]');
  if (carousel) {
    const previous = document.querySelector('[data-carousel-dir="-1"]');
    const next = document.querySelector('[data-carousel-dir="1"]');
    const firstCard = carousel.querySelector('.project-card');

    function updateCarouselControls() {
      if (previous) previous.disabled = carousel.scrollLeft < 5;
      if (next) next.disabled = carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 5;
    }

    if (firstCard) {
      for (const button of [previous, next].filter(Boolean)) {
        button.addEventListener('click', () => {
          const gap = parseFloat(getComputedStyle(carousel).gap) || 0;
          const distance = firstCard.getBoundingClientRect().width + gap;
          carousel.scrollBy({ left: Number(button.dataset.carouselDir) * distance, behavior: 'smooth' });
        });
      }
      carousel.addEventListener('scroll', updateCarouselControls, { passive: true });
      window.addEventListener('resize', updateCarouselControls);
      updateCarouselControls();
    }
  }

  // Show each section's local navigation while its heading is fully in view.
  const navigationPairs = [
    ['#projects .section-top h2', '#projects .section-links'],
    ['#about #about-title', '#about .section-links']
  ].map(([heading, nav]) => ({
    heading: document.querySelector(heading),
    nav: document.querySelector(nav)
  })).filter(({ heading, nav }) => heading && nav);

  function updateSectionNavigation() {
    for (const { heading, nav } of navigationPairs) {
      const { top, bottom } = heading.getBoundingClientRect();
      nav.classList.toggle('is-visible', top >= 0 && bottom <= window.innerHeight);
    }
  }

  if (navigationPairs.length) {
    window.addEventListener('scroll', updateSectionNavigation, { passive: true });
    window.addEventListener('resize', updateSectionNavigation);
    updateSectionNavigation();
  }

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
