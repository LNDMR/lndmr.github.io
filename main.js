
(function () {
  const root = document.documentElement;

  // ----------------------------------------
  // THEME SWITCHING
  // ----------------------------------------

  const pref = localStorage.getItem('lndmr-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  root.dataset.theme = pref || (prefersDark ? 'dark' : 'light');

  const updateTheme = () => {
    document.querySelectorAll('[data-theme-toggle]').forEach(b => {
      b.textContent = root.dataset.theme === 'dark' ? '☼' : '☾';

      b.setAttribute(
        'aria-label',
        root.dataset.theme === 'dark' ? 'Use light theme' : 'Use dark theme'
      );
    });
  };

  document.querySelectorAll('[data-theme-toggle]').forEach(b =>
    b.addEventListener('click', () => {
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';

      localStorage.setItem('lndmr-theme', root.dataset.theme);
      updateTheme();
    })
  );

  updateTheme();


  // ----------------------------------------
  // LANGUAGE SWITCHING
  // ----------------------------------------

  const lang = localStorage.getItem('lndmr-lang') === 'de' ? 'de' : 'en';

  function applyLanguage(l) {
    root.lang = l;

    document.querySelectorAll('[data-en][data-de]').forEach(el => {
      el.textContent = el.dataset[l];
    });

    document.querySelectorAll('[data-lang]').forEach(b => {
      b.setAttribute('aria-pressed', String(b.dataset.lang === l));
    });

    document.title =
      document.querySelector('meta[name="page-title-' + l + '"]')?.content ||
      document.title;

    localStorage.setItem('lndmr-lang', l);
  }

  document.querySelectorAll('[data-lang]').forEach(b =>
    b.addEventListener('click', () => applyLanguage(b.dataset.lang))
  );

  applyLanguage(lang);


  // ----------------------------------------
  // PROJECT CAROUSEL
  // ----------------------------------------

  const track = document.querySelector('[data-carousel]');

  if (track) {
    const buttons = [...document.querySelectorAll('[data-carousel-dir]')];

    const slide = () =>
      track.querySelector('.project-card').getBoundingClientRect().width +
      parseFloat(getComputedStyle(track).gap || 0);

    buttons.forEach(b =>
      b.addEventListener('click', () =>
        track.scrollBy({
          left: Number(b.dataset.carouselDir) * slide(),
          behavior: 'smooth'
        })
      )
    );

    const update = () => {
      buttons[0].disabled = track.scrollLeft < 5;

      buttons[1].disabled =
        track.scrollLeft + track.clientWidth >= track.scrollWidth - 5;
    };

    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);

    update();
  }

  // ----------------------------------------
  // SECTION NAVIGATION VISIBILITY
  // ----------------------------------------

  const sectionHeadings = [
    {
      heading: document.querySelector('#projects .section-top h2'),
      navigation: document.querySelector('#projects .section-links')
    },
    {
      heading: document.querySelector('#about #about-title'),
      navigation: document.querySelector('#about .section-links')
    }
  ];

  function updateSectionNavigation() {
    sectionHeadings.forEach(({ heading, navigation }) => {
      if (!heading || !navigation) return;

      const rect = heading.getBoundingClientRect();

      const isVisible =
        rect.top >= 0 &&
        rect.bottom <= window.innerHeight;

      navigation.classList.toggle('is-visible', isVisible);
    });
  }

  window.addEventListener('scroll', updateSectionNavigation, {
    passive: true
  });

  window.addEventListener('resize', updateSectionNavigation);

  updateSectionNavigation();

})();
