const CONTACT = Object.freeze({
  email: 'msashwath3009@gmail.com',
  linkedin: 'https://www.linkedin.com/feed/'
});

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGsap = Boolean(window.gsap && window.ScrollTrigger);
document.documentElement.dataset.motionRuntime = hasGsap ? 'gsap' : 'fallback';
const themeRoot = document.documentElement;
const themeStorageKey = 'ashwath-theme';
const themeConfig = {
  gold: { label: 'GOLD', accent: '#C9A838', rgb: { r: 201, g: 168, b: 56 } },
  neon: { label: 'NEON', accent: '#2BED34', rgb: { r: 43, g: 237, b: 52 } }
};

function applyContactLinks() {
  document.querySelectorAll('[data-contact="email"]').forEach((link) => {
    link.href = `mailto:${CONTACT.email}`;
  });

  document.querySelectorAll('[data-contact="linkedin"]').forEach((link) => {
    link.href = CONTACT.linkedin;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  });
}

function normalizeTheme(theme) {
  return theme === 'neon' ? 'neon' : 'gold';
}

function applyTheme(theme, { persist = true, animate = true } = {}) {
  const nextTheme = normalizeTheme(theme);
  const previousTheme = normalizeTheme(themeRoot.dataset.theme);
  const toggle = document.querySelector('.theme-toggle');
  const label = toggle?.querySelector('.theme-toggle-label');
  const glyph = toggle?.querySelector('.theme-toggle-glyph');
  themeRoot.dataset.theme = nextTheme;
  if (label) label.textContent = themeConfig[nextTheme].label;
  if (toggle) {
    const nextLabel = nextTheme === 'gold' ? 'neon' : 'gold';
    toggle.setAttribute('aria-pressed', String(nextTheme === 'neon'));
    toggle.setAttribute('aria-label', `${themeConfig[nextTheme].label[0] + themeConfig[nextTheme].label.slice(1).toLowerCase()} accent theme active. Switch to ${nextLabel} accent theme.`);
    toggle.title = `Switch to ${nextLabel} accent theme`;
  }
  if (persist) {
    try { localStorage.setItem(themeStorageKey, nextTheme); } catch (error) { /* Storage is optional. */ }
  }
  window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: nextTheme, accent: themeConfig[nextTheme].accent, rgb: { ...themeConfig[nextTheme].rgb } } }));
  if (animate && previousTheme !== nextTheme && hasGsap && !reducedMotion && glyph) {
    window.gsap.fromTo(glyph, { rotation: -110, scale: .45 }, { rotation: 0, scale: 1, duration: .72, ease: 'elastic.out(1,.55)', overwrite: true });
  }
}

function setupThemeToggle() {
  const toggle = document.querySelector('.theme-toggle');
  applyTheme(themeRoot.dataset.theme, { persist: false, animate: false });
  toggle?.addEventListener('click', () => applyTheme(themeRoot.dataset.theme === 'neon' ? 'gold' : 'neon'));
  window.addEventListener('storage', (event) => {
    if (event.key === themeStorageKey) applyTheme(event.newValue, { persist: false });
  });
}

function revealWithObserver() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
  }, { threshold: 0.13 });
  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
}

function startCanvas() {
  const canvas = document.getElementById('signal-canvas');
  const ctx = canvas.getContext('2d');
  const accentRgb = { ...themeConfig[normalizeTheme(themeRoot.dataset.theme)].rgb };
  let width, height, frame = 0;
  function resize() {
    const ratio = Math.min(devicePixelRatio, 2);
    width = canvas.clientWidth; height = canvas.clientHeight;
    canvas.width = width * ratio; canvas.height = height * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  function draw() {
    frame += 1;
    ctx.clearRect(0, 0, width, height);
    const gap = Math.max(11, Math.min(20, width / 70));
    for (let y = gap; y < height; y += gap) for (let x = gap; x < width; x += gap) {
      const wave = Math.sin(x * .015 + frame * .02) + Math.cos(y * .022 - frame * .016) + Math.sin((x + y) * .008);
      const dx = Math.cos(wave * 2.5) * 3; const dy = Math.sin(wave * 2.5) * 3;
      const bright = (wave + 3) / 6;
      ctx.fillStyle = wave > 1.15 ? `rgba(${Math.round(accentRgb.r)},${Math.round(accentRgb.g)},${Math.round(accentRgb.b)},${.18 + bright * .4})` : `rgba(255,255,255,${.025 + bright * .15})`;
      ctx.fillRect(x + dx, y + dy, 1.5, 1.5);
    }
    if (!reducedMotion) requestAnimationFrame(draw);
  }
  window.addEventListener('themechange', ({ detail }) => {
    const nextRgb = detail?.rgb || themeConfig[normalizeTheme(themeRoot.dataset.theme)].rgb;
    if (!reducedMotion && window.gsap) window.gsap.to(accentRgb, { ...nextRgb, duration: .72, ease: 'power2.inOut', overwrite: true });
    else {
      Object.assign(accentRgb, nextRgb);
      if (reducedMotion) draw();
    }
  });
  resize(); window.addEventListener('resize', resize, { passive: true }); draw();
}

function createCursor(gsap) {
  if (reducedMotion || !matchMedia('(pointer:fine)').matches) return;
  const dot = document.querySelector('.cursor');
  const aura = document.querySelector('.cursor-aura');
  const dotX = gsap.quickTo(dot, 'x', { duration: .055, ease: 'power3.out' });
  const dotY = gsap.quickTo(dot, 'y', { duration: .055, ease: 'power3.out' });
  const auraX = gsap.quickTo(aura, 'x', { duration: .28, ease: 'power3.out' });
  const auraY = gsap.quickTo(aura, 'y', { duration: .28, ease: 'power3.out' });
  gsap.set([dot, aura], { xPercent: -50, yPercent: -50, opacity: 0 });
  let pointerInitialized = false;
  let cursorVisible = false;
  const showCursor = () => {
    if (cursorVisible) return;
    cursorVisible = true;
    gsap.to([dot, aura], { opacity: 1, duration: .18, overwrite: 'auto' });
  };
  const handlePointerMove = ({ clientX, clientY }) => {
    if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) return;
    if (!pointerInitialized) {
      gsap.set(dot, { x: clientX, y: clientY });
      gsap.set(aura, { x: clientX, y: clientY });
      pointerInitialized = true;
    } else {
      dotX(clientX); dotY(clientY); auraX(clientX); auraY(clientY);
    }
    showCursor();
  };
  const hideCursor = () => {
    pointerInitialized = false;
    cursorVisible = false;
    gsap.to([dot, aura], { opacity: 0, duration: .18, overwrite: 'auto' });
  };
  window.addEventListener('pointermove', handlePointerMove, { passive: true });
  document.documentElement.addEventListener('pointerenter', handlePointerMove, { passive: true });
  document.documentElement.addEventListener('pointerleave', hideCursor);
  window.addEventListener('blur', hideCursor);
  document.querySelectorAll('a, button, .hero-name, .about-copy h2, .signal-copy, .trajectory-intro p, .pathway li, .skill-list div, .work-empty, .interest, .ai-callout, .contact-main h2').forEach((element) => {
    element.addEventListener('pointerenter', () => {
      dot.classList.add('is-active');
      aura.classList.add('is-active');
    });
    element.addEventListener('pointerleave', () => {
      dot.classList.remove('is-active');
      aura.classList.remove('is-active');
    });
  });
  document.querySelectorAll('.magnetic').forEach((element) => {
    element.addEventListener('pointermove', (event) => {
      const bounds = element.getBoundingClientRect();
      gsap.to(element, { x: (event.clientX - bounds.left - bounds.width / 2) * .13, y: (event.clientY - bounds.top - bounds.height / 2) * .13, duration: .35, ease: 'power3.out', overwrite: true });
    });
    element.addEventListener('pointerleave', () => gsap.to(element, { x: 0, y: 0, duration: .55, ease: 'elastic.out(1,.45)' }));
  });
}

function createMarquees(gsap) {
  const animations = gsap.utils.toArray('.ticker-track, .footer-band .ticker-track').map((track) => gsap.to(track, { xPercent: -50, duration: 30, repeat: -1, ease: 'none' }));
  let lastPosition = window.scrollY; let lastTime = performance.now();
  window.addEventListener('scroll', () => {
    const now = performance.now();
    const velocity = Math.abs(window.scrollY - lastPosition) / Math.max(now - lastTime, 1);
    animations.forEach((animation) => {
      gsap.to(animation, { timeScale: Math.min(1.65, 1 + velocity * .075), duration: .12, overwrite: true });
      gsap.to(animation, { timeScale: 1, duration: 1.25, delay: .08, ease: 'power3.out', overwrite: true });
    });
    lastPosition = window.scrollY; lastTime = now;
  }, { passive: true });
}

function revealText(gsap, element) {
  gsap.fromTo(element, { y: 46, opacity: 0, filter: 'blur(5px)', clipPath: 'inset(0 0 100% 0)' }, {
    y: 0, opacity: 1, filter: 'blur(0px)', clipPath: 'inset(0 0 0% 0)', duration: 1.05, ease: 'power4.out',
    scrollTrigger: { trigger: element, start: 'top 88%', once: true }
  });
}

function createNavigationTransitions(gsap) {
  const overlay = document.querySelector('.route-transition');
  const mask = overlay?.querySelector('.route-transition-mask');
  const stage = overlay?.querySelector('.route-transition-stage');
  const title = overlay?.querySelector('.route-transition-title');
  const titleInner = overlay?.querySelector('.route-transition-title-inner');
  const routeIndex = overlay?.querySelector('.route-transition-index');
  const routeSymbol = overlay?.querySelector('.route-transition-symbol');
  if (!overlay || !mask || !stage || !title || !titleInner || !routeIndex || !routeSymbol || reducedMotion) return;

  const routes = {
    '#top': {
      index: '(01)', title: 'HOME', symbol: '↙', variant: 'home',
      maskIn: 'inset(50% 50% 50% 50%)', maskCover: 'inset(0 0 0 0)', maskOut: 'inset(50% 50% 50% 50%)',
      titleFrom: { scale: 1.16, yPercent: 0 }, titleOut: { scale: .9, yPercent: 0 },
      arrivalClip: 'inset(6% 8% 6% 8%)'
    },
    '#about': {
      index: '(02)', title: 'ABOUT', symbol: '*', variant: 'about',
      maskIn: 'inset(0 100% 0 0)', maskCover: 'inset(0 0 0 0)', maskOut: 'inset(0 0 0 100%)',
      titleFrom: { scale: .94, xPercent: -12 }, titleOut: { scale: 1.03, xPercent: 10 },
      arrivalClip: 'inset(0 0 8% 0)'
    },
    '#work': {
      index: '(06)', title: 'WORKS', symbol: '//', variant: 'work',
      maskIn: 'inset(49.8% 0 49.8% 0)', maskCover: 'inset(0 0 0 0)', maskOut: 'inset(0 0 100% 0)',
      titleFrom: { scale: 1, yPercent: 18 }, titleOut: { scale: 1, xPercent: 9 },
      arrivalClip: 'inset(0 0 12% 0)'
    },
    '#contact': {
      index: '(09)', title: "LET'S TALK", symbol: '↗', variant: 'contact',
      maskIn: 'circle(0% at 82% 50%)', maskCover: 'circle(150% at 82% 50%)', maskOut: 'circle(0% at 18% 50%)',
      titleFrom: { scale: .96, xPercent: 13 }, titleOut: { scale: 1.05, xPercent: -10 },
      arrivalClip: 'circle(36% at 72% 50%)'
    }
  };
  const compact = window.matchMedia('(max-width: 700px)').matches;
  let transitioning = false;

  function currentScene() {
    const viewportCenter = window.innerHeight / 2;
    return Array.from(document.querySelectorAll('main > section')).reduce((nearest, section) => {
      const bounds = section.getBoundingClientRect();
      const distance = Math.abs(bounds.top + Math.min(bounds.height, window.innerHeight) / 2 - viewportCenter);
      return !nearest || distance < nearest.distance ? { section, distance } : nearest;
    }, null)?.section;
  }

  function updateCurrentLink(hash) {
    document.querySelectorAll('.nav nav a').forEach((link) => {
      if (link.getAttribute('href') === hash) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }

  document.querySelectorAll('.nav nav a, .wordmark, .scroll-cue').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (transitioning) {
        event.preventDefault();
        return;
      }
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const hash = link.getAttribute('href');
      const route = routes[hash];
      const target = route ? document.querySelector(hash) : null;
      if (!route || !target) return;

      const destinationY = hash === '#top' ? 0 : target.getBoundingClientRect().top + window.scrollY;
      if (Math.abs(window.scrollY - destinationY) < 3) {
        event.preventDefault();
        return;
      }

      event.preventDefault();
      transitioning = true;
      themeRoot.classList.add('is-route-transitioning');
      overlay.classList.add('is-active');
      overlay.dataset.variant = route.variant;

      const source = currentScene();
      const arrival = hash === '#top' ? document.querySelector('.hero') : target;
      const microMotion = window.PortfolioMicroMotion;
      const sourceExit = { opacity: .72, duration: compact ? .2 : .26, ease: 'power2.in' };
      if (source && !source.classList.contains('trajectory')) sourceExit.scale = route.variant === 'home' ? .975 : .99;

      routeIndex.textContent = route.index;
      titleInner.textContent = route.title;
      routeSymbol.textContent = route.symbol;
      microMotion?.prepareRouteTransition(route);
      gsap.killTweensOf([overlay, mask, stage, title, source, arrival]);

      const timeline = gsap.timeline({
        defaults: { ease: 'power4.inOut' },
        onComplete: () => {
          gsap.set([source, arrival], { clearProps: 'transform,opacity,clip-path' });
          gsap.set([overlay, mask, stage, title], { clearProps: 'visibility,opacity,clip-path,transform' });
          overlay.classList.remove('is-active');
          themeRoot.classList.remove('is-route-transitioning');
          microMotion?.resetRouteTransition();
          window.ScrollTrigger?.update();
          transitioning = false;
        }
      });

      timeline
        .set(overlay, { autoAlpha: 1 })
        .set(mask, { clipPath: route.maskIn })
        .set(stage, { clipPath: route.maskIn })
        .fromTo(title,
          { ...route.titleFrom, autoAlpha: 0, clipPath: 'inset(0 0 100% 0)' },
          { xPercent: 0, yPercent: 0, scale: 1, autoAlpha: 1, clipPath: 'inset(0 0 0% 0)', duration: compact ? .2 : .23 },
          .03)
        .to(source, sourceExit, 0)
        .to(mask, { clipPath: route.maskCover, duration: compact ? .3 : .34 }, 0)
        .to(stage, { clipPath: route.maskCover, duration: compact ? .3 : .34 }, 0)
        .call(() => microMotion?.playRouteTransition(route), null, .04)
        .call(() => {
          window.scrollTo({ top: destinationY, left: 0, behavior: 'auto' });
          if (window.location.hash !== hash) history.pushState(null, '', hash);
          updateCurrentLink(hash);
          window.ScrollTrigger?.update();
          window.dispatchEvent(new CustomEvent('portfolio:route-enter', { detail: { hash, variant: route.variant } }));
        }, null, compact ? .31 : .37)
        .set(arrival, { y: compact ? 10 : 18, opacity: .76, clipPath: route.arrivalClip }, compact ? .31 : .37)
        .to(source, { scale: 1, opacity: 1, duration: .34, ease: 'power3.out' }, compact ? .32 : .39)
        .to(arrival, { y: 0, opacity: 1, clipPath: route.variant === 'contact' ? 'circle(150% at 72% 50%)' : 'inset(0 0 0 0)', duration: compact ? .34 : .41, ease: 'power4.out' }, compact ? .34 : .41)
        .to(title, { ...route.titleOut, autoAlpha: 0, clipPath: 'inset(100% 0 0 0)', duration: .2, ease: 'power3.in' }, compact ? .39 : .45)
        .call(() => microMotion?.finishRouteTransition(route), null, compact ? .38 : .44)
        .to(mask, { clipPath: route.maskOut, duration: compact ? .33 : .39 }, compact ? .4 : .46)
        .to(stage, { clipPath: route.maskOut, duration: compact ? .33 : .39 }, compact ? .4 : .46);
    });
  });
  updateCurrentLink(window.location.hash);
}

function startGsap() {
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: 'power3.out' });
  const intro = gsap.timeline({ defaults: { ease: 'power4.out' } });
  intro.set(['.hero-name', '.hero-statement', '.hero-side', '.hero-edition', '.scroll-cue'], { autoAlpha: 0 })
    .set('.hero-rule, .hero-baseline', { scaleX: 0 })
    .to('.hero-rule', { scaleX: 1, duration: .8, delay: .16 })
    .fromTo('.hero-name', { xPercent: 5, scale: 1.035, clipPath: 'inset(0 0 100% 0)' }, { autoAlpha: 1, xPercent: 0, scale: 1, clipPath: 'inset(0 0 0% 0)', duration: 1.25 }, '-=.42')
    .fromTo('.hero-statement', { y: 34, filter: 'blur(5px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: .8 }, '-=.55')
    .to('.hero-baseline', { scaleX: 1, duration: .8 }, '-=.45')
    .to(['.hero-side', '.hero-edition', '.scroll-cue'], { autoAlpha: 1, y: 0, duration: .55, stagger: .08 }, '-=.38')
    .eventCallback('onComplete', () => {
      themeRoot.dataset.introComplete = 'true';
      window.dispatchEvent(new CustomEvent('portfolio:intro-complete'));
    });
  gsap.utils.toArray('.reveal').forEach((element) => revealText(gsap, element));
  gsap.to('.about-copy h2', { yPercent: -8, ease: 'none', scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: .7 } });
  gsap.to('.signal-copy span:first-child', { xPercent: 8, ease: 'none', scrollTrigger: { trigger: '.signal', start: 'top bottom', end: 'bottom top', scrub: .8 } });
  gsap.to('.signal-copy span:nth-child(2)', { xPercent: -8, ease: 'none', scrollTrigger: { trigger: '.signal', start: 'top bottom', end: 'bottom top', scrub: .8 } });
  gsap.to('.work-empty h2', { scale: 1.04, transformOrigin: 'left center', ease: 'none', scrollTrigger: { trigger: '.work', start: 'top 70%', end: 'bottom top', scrub: .7 } });
  ScrollTrigger.matchMedia({
    '(min-width: 701px)': () => {
      const pathway = document.querySelector('.pathway');
      const distance = () => Math.max(0, pathway.scrollWidth - window.innerWidth + 36);
      gsap.to(pathway, { x: () => -distance(), ease: 'none', scrollTrigger: { trigger: '.trajectory', start: 'top top', end: () => `+=${Math.max(1100, distance() * 1.05)}`, pin: true, scrub: 1, invalidateOnRefresh: true } });
    }
  });
  createMarquees(gsap);
  createCursor(gsap);
  createNavigationTransitions(gsap);
  ScrollTrigger.refresh();
}

function startExperience() {
  if (reducedMotion) document.querySelectorAll('.reveal').forEach((element) => element.classList.add('visible'));
  else if (hasGsap) startGsap();
  else revealWithObserver();
  window.PortfolioMicroMotion?.init({ ScrollTrigger: window.ScrollTrigger });
}

applyContactLinks();
setupThemeToggle();

if (document.fonts?.ready) document.fonts.ready.then(startExperience).catch(startExperience);
else startExperience();

startCanvas();
