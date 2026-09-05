(() => {
  const root = document.documentElement;
  let scope = null;
  let pageHideHandler = null;

  function getAnime() {
    const api = window.anime;
    return api?.animate && api?.createScope && api?.stagger && api?.utils ? api : null;
  }

  function init({ ScrollTrigger } = {}) {
    if (scope) return scope;

    const api = getAnime();
    if (!api) {
      root.dataset.microMotion = 'fallback';
      return null;
    }

    const { animate, createScope, stagger, utils } = api;
    root.dataset.microMotion = 'anime';

    scope = createScope({
      root: document,
      defaults: { duration: 260, ease: 'out(3)' },
      mediaQueries: {
        finePointer: '(hover: hover) and (pointer: fine)',
        reduceMotion: '(prefers-reduced-motion: reduce)'
      }
    }).add((self) => {
      const cleanups = [];
      const triggers = [];
      const observers = [];
      const trackedTargets = new Set();
      const activeAnimations = new WeakMap();
      const entranceAnimations = new Set();

      function listen(target, type, handler, options) {
        target.addEventListener(type, handler, options);
        cleanups.push(() => target.removeEventListener(type, handler, options));
      }

      function run(target, channel, parameters) {
        if (!target) return null;
        trackedTargets.add(target);
        let channels = activeAnimations.get(target);
        if (!channels) {
          channels = new Map();
          activeAnimations.set(target, channels);
        }
        channels.get(channel)?.cancel();
        const animation = animate(target, parameters);
        channels.set(channel, animation);
        return animation;
      }

      function runEntrance(targets, parameters) {
        if (!targets.length) return null;
        const animation = animate(targets, parameters);
        entranceAnimations.add(animation);
        return animation;
      }

      function animateAccentLine(line, active, channel = 'line') {
        return run(line, channel, {
          scaleX: active ? 1 : .18,
          opacity: active ? 1 : 0,
          duration: active ? 240 : 360,
          ease: active ? 'out(4)' : 'out(3)'
        });
      }

      function animateMetadata(targets) {
        return runEntrance(targets, {
          x: 0,
          opacity: 1,
          duration: 430,
          delay: stagger(38),
          ease: 'out(4)'
        });
      }

      function animateSectionMarker(marker) {
        return animateMetadata(Array.from(marker.children).filter((child) => !child.matches('[aria-hidden="true"]')));
      }

      function animateNavHover(link, active) {
        const label = link.querySelector('.nav-label');
        const symbol = link.querySelector('.nav-symbol');
        const line = link.querySelector('.nav-micro-line');
        run(label, 'nav-label', { x: active ? 3 : 0, opacity: active ? .86 : 1, duration: active ? 220 : 340 });
        run(symbol, 'nav-symbol', { x: active ? 4 : 0, y: active ? -1 : 0, rotate: active ? 5 : 0, duration: active ? 240 : 360 });
        animateAccentLine(line, active, 'nav-line');
      }

      function animateTextHover(target, active) {
        const baseSpacing = Number(target.dataset.microSpacing || getComputedStyle(target).letterSpacing.replace('px', '')) || 0;
        if (!target.dataset.microSpacing) target.dataset.microSpacing = String(baseSpacing);
        run(target, 'text', {
          y: active ? -2 : 0,
          scale: active ? 1.006 : 1,
          letterSpacing: active ? baseSpacing + .65 : baseSpacing,
          duration: active ? 260 : 420,
          ease: active ? 'out(4)' : 'out(3)'
        });
      }

      function animateHobbyHover(row, active) {
        const word = row.querySelector('h2');
        const line = row.querySelector('.interest-micro-line');
        const marker = row.querySelector('.interest-marker');
        const baseSpacing = Number(word.dataset.microSpacing || getComputedStyle(word).letterSpacing.replace('px', '')) || 0;
        if (!word.dataset.microSpacing) word.dataset.microSpacing = String(baseSpacing);
        run(word, 'hobby-word', {
          x: active ? 7 : 0,
          letterSpacing: active ? baseSpacing + .45 : baseSpacing,
          duration: active ? 240 : 380,
          ease: active ? 'out(4)' : 'out(3)'
        });
        animateAccentLine(line, active, 'hobby-line');
        run(marker, 'hobby-marker', {
          opacity: active ? 1 : 0,
          scale: active ? 1 : .5,
          x: active ? 4 : 0,
          duration: active ? 220 : 340
        });
      }

      function animateContactHover(link, active) {
        const label = link.querySelector('.contact-label');
        const line = link.querySelector('.contact-micro-line');
        const arrow = link.querySelector('i');
        run(label, 'contact-label', { x: active ? 5 : 0, opacity: active ? .9 : 1, duration: active ? 230 : 360 });
        run(line, 'contact-line', {
          scaleX: active ? 1 : .22,
          opacity: active ? .9 : .22,
          duration: active ? 260 : 380,
          ease: active ? 'out(4)' : 'out(3)'
        });
        run(arrow, 'contact-arrow', { x: active ? 4 : 0, y: active ? -3 : 0, duration: active ? 230 : 380 });
      }

      function animateProjectHover(row, active) {
        const content = Array.from(row.children).filter((child) => !child.classList.contains('work-micro-line'));
        const line = row.querySelector('.work-micro-line');
        content.forEach((item, index) => run(item, `project-${index}`, {
          x: active ? Math.min(7, 2 + index * 2) : 0,
          opacity: active ? .78 + index * .08 : 1,
          duration: active ? 240 : 380
        }));
        animateAccentLine(line, active, 'project-line');
      }

      function bindHover(target, enter, leave = enter) {
        listen(target, 'pointerenter', () => enter(true));
        listen(target, 'pointerleave', () => leave(false));
        listen(target, 'focusin', () => enter(true));
        listen(target, 'focusout', () => leave(false));
      }

      function setupEntrance(targets, trigger, revealTargets = () => animateMetadata(targets)) {
        if (!targets.length || !trigger) return;
        const bounds = trigger.getBoundingClientRect();
        if (bounds.bottom <= 0) return;

        utils.set(targets, { x: 8, opacity: 0 });
        const reveal = revealTargets;

        if (bounds.top <= window.innerHeight * .88) {
          requestAnimationFrame(reveal);
        } else if (ScrollTrigger?.create) {
          triggers.push(ScrollTrigger.create({ trigger, start: 'top 88%', once: true, onEnter: reveal }));
        } else {
          const observer = new IntersectionObserver((entries, currentObserver) => {
            if (!entries.some((entry) => entry.isIntersecting)) return;
            reveal();
            currentObserver.disconnect();
          }, { threshold: .12 });
          observer.observe(trigger);
          observers.push(observer);
        }
      }

      function setupMetadataEntrances() {
        const sectionMarkers = Array.from(document.querySelectorAll('.section-label'));
        sectionMarkers.forEach((marker) => {
          const targets = Array.from(marker.children);
          setupEntrance(targets, marker.closest('section') || marker, () => animateSectionMarker(marker));
        });

        const metadataGroups = [
          ['.education .meta', '.education'],
          ['.trajectory-intro .meta', '.trajectory'],
          ['.work-top > .meta', '.work'],
          ['.work-empty > .meta', '.work'],
          ['.ai-callout > .meta', '.ai-callout'],
          ['.callout-bottom > span', '.ai-callout'],
          ['.contact-links > .meta', '.contact'],
          ['.footer-info > div', 'footer']
        ];

        metadataGroups.forEach(([targetSelector, triggerSelector]) => {
          setupEntrance(Array.from(document.querySelectorAll(targetSelector)), document.querySelector(triggerSelector));
        });

        const heroMetadata = Array.from(document.querySelectorAll('.hero-side > span, .hero-edition > span, .hero-direction > span'));
        utils.set(heroMetadata, { x: 8, opacity: 0 });
        const revealHeroMetadata = () => animateMetadata(heroMetadata);
        if (root.dataset.introComplete === 'true' || !window.gsap) requestAnimationFrame(revealHeroMetadata);
        else listen(window, 'portfolio:intro-complete', revealHeroMetadata, { once: true });
      }

      if (self.matches.reduceMotion) {
        root.dataset.microMotion = 'reduced';
        return () => { root.dataset.microMotion = 'anime'; };
      }

      setupMetadataEntrances();

      if (self.matches.finePointer) {
        document.querySelectorAll('.nav nav a').forEach((link) => bindHover(link, (active) => animateNavHover(link, active)));

        const heroName = document.querySelector('.hero-name-inner');
        const bindHero = () => bindHover(heroName, (active) => animateTextHover(heroName, active));
        if (root.dataset.introComplete === 'true' || !window.gsap) bindHero();
        else listen(window, 'portfolio:intro-complete', bindHero, { once: true });

        document.querySelectorAll('.interest').forEach((row) => bindHover(row, (active) => animateHobbyHover(row, active)));
        document.querySelectorAll('.contact-links a').forEach((link) => bindHover(link, (active) => animateContactHover(link, active)));
        document.querySelectorAll('.work-line').forEach((row) => bindHover(row, (active) => animateProjectHover(row, active)));
      }

      return () => {
        cleanups.splice(0).forEach((cleanup) => cleanup());
        triggers.splice(0).forEach((trigger) => trigger.kill());
        observers.splice(0).forEach((observer) => observer.disconnect());
        entranceAnimations.forEach((animation) => animation.cancel());
        trackedTargets.forEach((target) => activeAnimations.get(target)?.forEach((animation) => animation.cancel()));
        document.querySelectorAll('.nav-label,.nav-symbol,.nav-micro-line,.hero-name-inner,.section-label>span,.education .meta,.trajectory-intro .meta,.work-top>.meta,.work-empty>.meta,.ai-callout>.meta,.callout-bottom>span,.contact-links>.meta,.footer-info>div,.interest h2,.interest-micro-line,.interest-marker,.contact-label,.contact-micro-line,.contact-links i,.work-line>span').forEach((element) => {
          element.style.removeProperty('transform');
          element.style.removeProperty('opacity');
          element.style.removeProperty('letter-spacing');
        });
      };
    });

    pageHideHandler = () => destroy();
    window.addEventListener('pagehide', pageHideHandler, { once: true });
    return scope;
  }

  function destroy() {
    if (!scope) return;
    scope.revert();
    scope = null;
    if (pageHideHandler) window.removeEventListener('pagehide', pageHideHandler);
    pageHideHandler = null;
    root.dataset.microMotion = 'idle';
  }

  window.PortfolioMicroMotion = Object.freeze({
    init,
    destroy
  });
})();
