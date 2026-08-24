const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGsap = Boolean(window.gsap && window.ScrollTrigger);

function revealWithObserver() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
  }, { threshold: 0.13 });
  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
}

function startCanvas() {
  const canvas = document.getElementById('signal-canvas');
  const ctx = canvas.getContext('2d');
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
      ctx.fillStyle = wave > 1.15 ? `rgba(201,168,56,${.18 + bright * .4})` : `rgba(255,255,255,${.025 + bright * .15})`;
      ctx.fillRect(x + dx, y + dy, 1.5, 1.5);
    }
    if (!reducedMotion) requestAnimationFrame(draw);
  }
  resize(); window.addEventListener('resize', resize, { passive: true }); draw();
}

function createCursor(gsap) {
  if (reducedMotion || !matchMedia('(pointer:fine)').matches) return;
  const dot = document.querySelector('.cursor');
  const aura = document.querySelector('.cursor-aura');
  const dotX = gsap.quickTo(dot, 'x', { duration: .1, ease: 'power3.out' });
  const dotY = gsap.quickTo(dot, 'y', { duration: .1, ease: 'power3.out' });
  const auraX = gsap.quickTo(aura, 'x', { duration: .3, ease: 'power3.out' });
  const auraY = gsap.quickTo(aura, 'y', { duration: .3, ease: 'power3.out' });
  gsap.set([dot, aura], { xPercent: -50, yPercent: -50 });
  window.addEventListener('pointermove', ({ clientX, clientY }) => {
    dotX(clientX); dotY(clientY); auraX(clientX); auraY(clientY);
  }, { passive: true });
  document.addEventListener('mouseleave', () => gsap.to([dot, aura], { opacity: 0, duration: .2 }));
  document.addEventListener('mouseenter', () => gsap.to([dot, aura], { opacity: 1, duration: .2 }));
  document.querySelectorAll('a, .interest, .skill-list div, .work-empty, .trajectory').forEach((element) => {
    element.addEventListener('pointerenter', () => {
      dot.classList.add('is-active');
      aura.classList.add('is-active');
    });
    element.addEventListener('pointerleave', () => {
      dot.classList.remove('is-active');
      aura.classList.remove('is-active');
    });
  });
  document.querySelectorAll('.magnetic, .nav a, .contact-links a').forEach((element) => {
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
    .to(['.hero-side', '.hero-edition', '.scroll-cue'], { autoAlpha: 1, y: 0, duration: .55, stagger: .08 }, '-=.38');
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
  ScrollTrigger.refresh();
}

function startExperience() {
  if (reducedMotion) document.querySelectorAll('.reveal').forEach((element) => element.classList.add('visible'));
  else if (hasGsap) startGsap();
  else revealWithObserver();
}

if (document.fonts?.ready) document.fonts.ready.then(startExperience).catch(startExperience);
else startExperience();

startCanvas();
