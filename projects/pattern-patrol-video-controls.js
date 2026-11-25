/* Pattern Patrol: paired walkthroughs are manual on desktop, viewport-autoplay on phones. */
(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobileLayout = window.matchMedia('(max-width: 600px)');
  const copy = {
    en: { play: 'Play', pause: 'Pause', replay: 'Replay', playVideo: 'Play video', pauseVideo: 'Pause video', replayVideo: 'Replay video', group: 'Video playback controls' },
    de: { play: 'Abspielen', pause: 'Pause', replay: 'Neustart', playVideo: 'Video abspielen', pauseVideo: 'Video pausieren', replayVideo: 'Video von vorne abspielen', group: 'Videowiedergabe steuern' }
  };
  const labels = () => copy[(document.documentElement.lang || 'en').slice(0, 2)] || copy.en;
  const entries = [...document.querySelectorAll('.pp-demo-card')].map(unit => ({
    unit,
    video: unit.querySelector('video'),
    playButton: unit.querySelector('.pp-toggle-play'),
    replayButton: unit.querySelector('.pp-replay'),
    controls: unit.querySelector('.pp-video-controls'),
    inView: false,
    visibilityRatio: 0,
    manuallyPaused: false,
    manuallyStarted: false
  })).filter(e => e.video && e.playButton && e.replayButton && e.controls);

  function refresh(e) {
    const playing = !e.video.paused && !e.video.ended;
    const current = labels();
    e.unit.classList.toggle('is-playing', playing);
    const t = e.playButton.querySelector('.pp-video-control-label');
    const r = e.replayButton.querySelector('.pp-video-control-label');
    if (t) {
      t.dataset.en = playing ? copy.en.pause : copy.en.play;
      t.dataset.de = playing ? copy.de.pause : copy.de.play;
      t.textContent = playing ? current.pause : current.play;
    }
    if (r) r.textContent = current.replay;
    e.playButton.setAttribute('aria-label', playing ? current.pauseVideo : current.playVideo);
    e.replayButton.setAttribute('aria-label', current.replayVideo);
    e.controls.setAttribute('aria-label', current.group);
  }

  function play(e) {
    // Never allow two adjacent demonstrations to play simultaneously.
    for (const other of entries) if (other !== e && !other.video.paused) other.video.pause();
    const attempt = e.video.play();
    if (attempt?.catch) attempt.catch(() => refresh(e));
  }

  for (const e of entries) {
    e.video.muted = true;
    e.video.playsInline = true;
    e.video.loop = true;
    e.video.removeAttribute('autoplay');
    e.video.pause();
    for (const event of ['play', 'pause', 'ended']) e.video.addEventListener(event, () => refresh(e));
    e.video.addEventListener('play', () => {
      for (const other of entries) if (other !== e && !other.video.paused) other.video.pause();
    });
    e.playButton.addEventListener('click', () => {
      if (e.video.paused || e.video.ended) {
        e.manuallyPaused = false;
        e.manuallyStarted = true;
        play(e);
      } else {
        e.manuallyPaused = true;
        e.manuallyStarted = false;
        e.video.pause();
      }
    });
    e.replayButton.addEventListener('click', () => {
      e.manuallyPaused = false;
      e.manuallyStarted = true;
      e.video.currentTime = 0;
      play(e);
    });
    refresh(e);
  }

  function syncMobileAutoplay() {
    if (!mobileLayout.matches || reducedMotion.matches || document.hidden) return;
    const candidates = entries.filter(e => e.inView && !e.manuallyPaused);
    const manuallyPlaying = candidates.find(e => e.manuallyStarted && !e.video.paused);
    const selected = manuallyPlaying || candidates.sort((a, b) => b.visibilityRatio - a.visibilityRatio)[0];
    if (!selected) return;
    for (const e of entries) if (e !== selected && !e.video.paused) e.video.pause();
    if (selected.video.paused) play(selected);
  }

  if ('IntersectionObserver' in window) {
    const lookup = new Map(entries.map(e => [e.unit, e]));
    const observer = new IntersectionObserver(records => {
      for (const record of records) {
        const e = lookup.get(record.target);
        if (!e) continue;
        e.visibilityRatio = record.intersectionRatio;
        const visible = record.isIntersecting && record.intersectionRatio >= 0.35;
        if (e.inView === visible) continue;
        e.inView = visible;
        if (!visible) {
          e.video.pause();
          e.manuallyPaused = false;
          e.manuallyStarted = false;
        } else {
          e.video.currentTime = 0;
          refresh(e);
        }
      }
      syncMobileAutoplay();
    }, { threshold: [0, 0.35, 0.5, 0.65, 0.8, 1] });
    for (const e of entries) observer.observe(e.unit);
  } else {
    for (const e of entries) e.inView = true;
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) for (const e of entries) e.video.pause();
    else {
      if (!mobileLayout.matches && !reducedMotion.matches) {
        for (const e of entries) if (e.inView && e.manuallyStarted && !e.manuallyPaused) play(e);
      }
      syncMobileAutoplay();
    }
  });
  const onMotionChange = () => {
    if (reducedMotion.matches) {
      for (const e of entries) if (!e.manuallyStarted) e.video.pause();
    } else syncMobileAutoplay();
  };
  if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', onMotionChange);
  else reducedMotion.addListener(onMotionChange);
  mobileLayout.addEventListener?.('change', () => {
    if (!mobileLayout.matches) for (const e of entries) if (!e.manuallyStarted) e.video.pause();
    else syncMobileAutoplay();
  });
  document.addEventListener('portfolio:languagechange', () => entries.forEach(refresh));
})();
