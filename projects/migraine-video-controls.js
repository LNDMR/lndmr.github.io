/* Case-study video playback: viewport-aware, manually controllable, reduced-motion safe. */
(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobileLayout = window.matchMedia('(max-width: 600px)');
  const copy = {
    en: { play: 'Play', pause: 'Pause', replay: 'Replay', playVideo: 'Play video', pauseVideo: 'Pause video', replayVideo: 'Replay video', group: 'Video playback controls' },
    de: { play: 'Abspielen', pause: 'Pause', replay: 'Neustart', playVideo: 'Video abspielen', pauseVideo: 'Video pausieren', replayVideo: 'Video von vorne abspielen', group: 'Videowiedergabe steuern' }
  };
  const labels = () => copy[document.documentElement.lang?.slice(0, 2)] || copy.en;

  const entries = [...document.querySelectorAll('.mt-video-unit, .mt-detail-device, .mt-custom-device')]
    .map(unit => ({
      unit,
      video: unit.querySelector('video'),
      playButton: unit.querySelector('.mt-toggle-play'),
      replayButton: unit.querySelector('.mt-replay'),
      controls: unit.querySelector('.mt-video-controls'),
      inView: false,
      visibilityRatio: 0,
      manuallyPaused: false,
      manuallyStarted: false,
      clickToPlay: unit.classList.contains('mt-custom-device')
    }))
    .filter(entry => entry.video && entry.playButton && entry.replayButton && entry.controls);

  function refresh(entry) {
    const playing = !entry.video.paused && !entry.video.ended;
    const current = labels();
    entry.unit.classList.toggle('is-playing', playing);

    const playText = entry.playButton.querySelector('.mt-video-control-label');
    if (playText) {
      playText.dataset.en = playing ? copy.en.pause : copy.en.play;
      playText.dataset.de = playing ? copy.de.pause : copy.de.play;
      playText.textContent = playing ? current.pause : current.play;
    }
    const replayText = entry.replayButton.querySelector('.mt-video-control-label');
    if (replayText) replayText.textContent = current.replay;
    entry.playButton.setAttribute('aria-label', playing ? current.pauseVideo : current.playVideo);
    entry.replayButton.setAttribute('aria-label', current.replayVideo);
    entry.controls.setAttribute('aria-label', current.group);
    entry.playButton.removeAttribute('aria-pressed');
  }

  const mobilePaired = entry => entry.clickToPlay && mobileLayout.matches;
  const autoAllowed = entry => !entry.clickToPlay || mobilePaired(entry);

  function play(entry) {
    // The media's actual play/pause events determine the visible button state.
    if (entry.clickToPlay) {
      for (const other of entries) {
        if (other !== entry && other.clickToPlay && !other.video.paused) other.video.pause();
      }
    }
    const attempt = entry.video.play();
    if (attempt?.catch) attempt.catch(() => refresh(entry));
  }

  for (const entry of entries) {
    const { video, playButton, replayButton } = entry;
    video.muted = true;
    video.playsInline = true;
    video.loop = true;
    video.removeAttribute('autoplay');
    video.pause();
    for (const event of ['play', 'pause', 'ended']) video.addEventListener(event, () => refresh(entry));
    video.addEventListener('play', () => {
      if (entry.clickToPlay) for (const other of entries) {
        if (other !== entry && other.clickToPlay && !other.video.paused) other.video.pause();
      }
    });

    playButton.addEventListener('click', () => {
      if (video.paused || video.ended) {
        entry.manuallyPaused = false;
        entry.manuallyStarted = true;
        play(entry);
      } else {
        entry.manuallyPaused = true;
        entry.manuallyStarted = false;
        video.pause();
      }
    });

    replayButton.addEventListener('click', () => {
      entry.manuallyPaused = false;
      entry.manuallyStarted = true;
      video.currentTime = 0;
      play(entry);
    });
    refresh(entry);
  }

  // On phones the two customization demos are stacked. Only the most visible
  // demo can autoplay; on desktop both remain manual. Respect a user pause.
  function syncPairedAutoplay() {
    const paired = entries.filter(mobilePaired);
    if (!paired.length || document.hidden || reducedMotion.matches) return;
    const candidates = paired.filter(e => e.inView && !e.manuallyPaused);
    const manuallyPlaying = candidates.find(e => e.manuallyStarted && !e.video.paused);
    const selected = manuallyPlaying || candidates.sort((a, b) => b.visibilityRatio - a.visibilityRatio)[0];
    if (!selected) return;
    for (const e of paired) {
      if (e !== selected && !e.video.paused) e.video.pause();
    }
    if (selected.video.paused) play(selected);
  }

  // Returning after a full scroll-away starts a new viewing session.
  // Reduced-motion visitors must explicitly choose Play.
  if ('IntersectionObserver' in window) {
    const lookup = new Map(entries.map(entry => [entry.unit, entry]));
    const observer = new IntersectionObserver(records => {
      for (const record of records) {
        const entry = lookup.get(record.target);
        if (!entry) continue;
        entry.visibilityRatio = record.intersectionRatio;
        const visible = record.isIntersecting && record.intersectionRatio >= 0.35;
        if (entry.inView === visible) continue;
        entry.inView = visible;
        if (!visible) {
          entry.video.pause();
          entry.manuallyPaused = false;
          entry.manuallyStarted = false;
        } else {
          entry.video.currentTime = 0;
          if (!entry.clickToPlay && !document.hidden && !reducedMotion.matches) play(entry);
          else refresh(entry);
        }
      }
      syncPairedAutoplay();
    }, { threshold: [0, 0.35, 0.5, 0.65, 0.8, 1] });
    for (const entry of entries) observer.observe(entry.unit);
  } else {
    for (const entry of entries) entry.inView = true;
  }

  document.addEventListener('visibilitychange', () => {
    for (const entry of entries) {
      if (document.hidden) entry.video.pause();
      else if (entry.inView && !entry.manuallyPaused && (!reducedMotion.matches || entry.manuallyStarted) && autoAllowed(entry)) {
        if (!entry.clickToPlay) play(entry);
      }
    }
    if (!document.hidden) syncPairedAutoplay();
  });

  function onMotionChange() {
    for (const entry of entries) {
      if (reducedMotion.matches && !entry.manuallyStarted) entry.video.pause();
      else if (!reducedMotion.matches && entry.inView && !entry.manuallyPaused && !document.hidden && !entry.clickToPlay) play(entry);
    }
  }
  mobileLayout.addEventListener?.('change', () => {
    if (!mobileLayout.matches) for (const e of entries.filter(e => e.clickToPlay && !e.manuallyStarted)) e.video.pause();
    else syncPairedAutoplay();
  });
  if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', onMotionChange);
  else reducedMotion.addListener(onMotionChange);
  reducedMotion.addEventListener?.('change', syncPairedAutoplay);

  document.addEventListener('portfolio:languagechange', () => entries.forEach(refresh));
})();
