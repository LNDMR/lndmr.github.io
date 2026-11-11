/* Shared interactions: theme, language, and project carousel. */
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
      // Keep the Skyjo composition readable while either side of its tile is clipped.
      // The artwork follows the text; neither element abruptly switches layout modes.
      const skyjoTile = carousel.querySelector('.skyjo-project');
      const skyjoArt = skyjoTile?.querySelector('.skyjo-art');
      const skyjoHeadline = skyjoTile?.querySelector('.placeholder');
      const skyjoArtwork = skyjoTile?.querySelector('.skyjo-card-pair');
      const skyjoInfoText = skyjoTile?.querySelector('.card-info > div');
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      const mobileSkyjo = window.matchMedia('(max-width: 700px)');
      let skyjoFramePending = false;

      function updateSkyjoArtwork() {
        skyjoFramePending = false;
        if (!skyjoTile || !skyjoArtwork || !skyjoHeadline || !skyjoArt) return;

        if (reducedMotion.matches || mobileSkyjo.matches) {
          skyjoArt.style.removeProperty('--skyjo-content-shift');
          skyjoInfoText?.style.removeProperty('--skyjo-info-shift');
          for (const name of ['--skyjo-art-width', '--skyjo-art-left', '--skyjo-art-opacity']) {
            skyjoArtwork.style.removeProperty(name);
          }
          return;
        }

        const viewport = carousel.getBoundingClientRect();
        const tile = skyjoArt.getBoundingClientRect();
        const width = tile.width;
        const visibleLeft = Math.max(0, viewport.left - tile.left);
        const visibleRight = Math.min(width, viewport.right - tile.left);
        const visibleWidth = Math.max(0, visibleRight - visibleLeft);
        const fraction = Math.min(1, visibleWidth / width);
        const padding = Math.min(40, Math.max(24, width * 0.05));

        // Move the ENTIRE typographic composition right when the tile exits left.
        // Compensate for our previous transform before measuring its natural location.
        const oldShift = parseFloat(skyjoArt.style.getPropertyValue('--skyjo-content-shift')) || 0;
        const textBox = skyjoHeadline.getBoundingClientRect();
        const naturalTextLeft = textBox.left - tile.left - oldShift;
        // The flex span can be wider than the printed letters. Measure the
        // actual longest headline line so cards can use the empty space.
        const textStyle = getComputedStyle(skyjoHeadline);
        const measureCanvas = document.createElement('canvas');
        const measureContext = measureCanvas.getContext('2d');
        measureContext.font = `${textStyle.fontWeight} ${textStyle.fontSize} ${textStyle.fontFamily}`;
        const letterSpacing = parseFloat(textStyle.letterSpacing) || 0;
        const lines = ['DRAW.', 'SWAP.', 'SCORE.'];
        const textWidth = Math.max(...lines.map(line =>
          measureContext.measureText(line).width + letterSpacing * (line.length - 1)
        )) + 8;
        const shift = Math.max(0, visibleLeft + padding - naturalTextLeft);
        skyjoArt.style.setProperty('--skyjo-content-shift', `${shift.toFixed(2)}px`);
        // Match the headline's offset; at rest this is exactly zero.
        // Do not change the original caption's size, alignment or wrapping.
        skyjoInfoText?.style.setProperty('--skyjo-info-shift', `${shift.toFixed(2)}px`);

        // Allocate the remaining visible horizontal space to the artwork.
        // Keep a visual gap between headline and cards, in BOTH scroll directions.
        const textRight = naturalTextLeft + shift + textWidth;
        const artStart = Math.max(visibleLeft + padding, textRight + 22);
        const artEnd = visibleRight - padding;
        const availableWidth = Math.max(0, artEnd - artStart);
        const idealWidth = width * 0.34;
        const imageWidth = Math.min(idealWidth, Math.max(0, availableWidth - 6));
        const imageLeft = artStart + Math.max(0, (availableWidth - imageWidth) * 0.46);

        // Fade out only when there is no meaningful space for both elements.
        const fadeStart = width * 0.06;
        const fadeEnd = width * 0.16;
        const opacity = Math.max(0, Math.min(1, (availableWidth - fadeStart) / (fadeEnd - fadeStart)));

        skyjoArtwork.style.setProperty('--skyjo-art-width', `${imageWidth.toFixed(2)}px`);
        skyjoArtwork.style.setProperty('--skyjo-art-left', `${imageLeft.toFixed(2)}px`);
        skyjoArtwork.style.setProperty('--skyjo-art-opacity', opacity.toFixed(3));
      }

      function scheduleSkyjoArtworkUpdate() {
        if (skyjoFramePending) return;
        skyjoFramePending = true;
        requestAnimationFrame(updateSkyjoArtwork);
      }

      carousel.addEventListener('scroll', scheduleSkyjoArtworkUpdate, { passive: true });
      window.addEventListener('resize', scheduleSkyjoArtworkUpdate);
      reducedMotion.addEventListener('change', scheduleSkyjoArtworkUpdate);
      mobileSkyjo.addEventListener('change', scheduleSkyjoArtworkUpdate);
      scheduleSkyjoArtworkUpdate();
      carousel.addEventListener('scroll', updateCarouselControls, { passive: true });
      window.addEventListener('resize', updateCarouselControls);
      updateCarouselControls();
    }
  } // Ende Carousel

  // Footer year
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

})();
