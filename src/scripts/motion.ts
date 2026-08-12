type MotionLevel = 'expressive' | 'standard' | 'reading' | 'none';

interface MotionState {
  initialized: boolean;
  observer?: IntersectionObserver;
  frame: number;
  pointerX: number;
  pointerY: number;
  currentX: number;
  currentY: number;
  finePointer: boolean;
  reduced: boolean;
}

declare global {
  interface Window {
    __ymllMotion?: MotionState;
  }
}

const state: MotionState = window.__ymllMotion ?? {
  initialized: false,
  frame: 0,
  pointerX: 0,
  pointerY: 0,
  currentX: 0,
  currentY: 0,
  finePointer: matchMedia('(hover: hover) and (pointer: fine)').matches,
  reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
};

window.__ymllMotion = state;

function motionLevel(): MotionLevel {
  return (document.body?.dataset.motion as MotionLevel) || 'standard';
}

function shouldIgnorePointer(event: PointerEvent) {
  if (event.button !== 0 || event.isPrimary === false) return true;
  const target = event.target;
  if (!(target instanceof Element)) return false;
  if (target.closest('input, textarea, select, [contenteditable="true"], [data-no-ink]')) return true;
  if (motionLevel() === 'reading' && target.closest('.article-prose') && !target.closest('a, button')) return true;
  return false;
}

function createInk(event: PointerEvent) {
  if (state.reduced || motionLevel() === 'none' || shouldIgnorePointer(event)) return;
  const layer = document.getElementById('click-ink-layer');
  if (!layer) return;

  while (layer.childElementCount >= 8) layer.firstElementChild?.remove();
  const effect = document.createElement('span');
  effect.className = `click-ink${event.pointerType === 'touch' ? ' click-ink--touch' : ''}`;
  effect.style.setProperty('--ink-x', `${event.clientX}px`);
  effect.style.setProperty('--ink-y', `${event.clientY}px`);
  effect.append(document.createElement('i'), document.createElement('b'));
  layer.append(effect);
  effect.addEventListener('animationend', (animationEvent) => {
    if (animationEvent.target === effect) effect.remove();
  });
}

function animatePointer() {
  state.frame = 0;
  state.currentX += (state.pointerX - state.currentX) * 0.16;
  state.currentY += (state.pointerY - state.currentY) * 0.16;

  const glow = document.getElementById('cursor-glow');
  if (glow) {
    glow.style.setProperty('--pointer-x', `${state.currentX}px`);
    glow.style.setProperty('--pointer-y', `${state.currentY}px`);
  }

  const width = Math.max(innerWidth, 1);
  const height = Math.max(innerHeight, 1);
  const normalizedX = state.currentX / width - 0.5;
  const normalizedY = state.currentY / height - 0.5;
  document.documentElement.style.setProperty('--grid-x', `${normalizedX * -4}px`);
  document.documentElement.style.setProperty('--grid-y', `${normalizedY * -4}px`);
  document.documentElement.style.setProperty('--hero-x', `${normalizedX * -8}px`);
  document.documentElement.style.setProperty('--hero-y', `${normalizedY * -8}px`);

  if (Math.abs(state.pointerX - state.currentX) > 0.1 || Math.abs(state.pointerY - state.currentY) > 0.1) {
    state.frame = requestAnimationFrame(animatePointer);
  }
}

function trackPointer(event: PointerEvent) {
  if (!state.finePointer || state.reduced || motionLevel() !== 'expressive') return;
  state.pointerX = event.clientX;
  state.pointerY = event.clientY;
  document.documentElement.dataset.pointerActive = 'true';
  if (!state.frame) state.frame = requestAnimationFrame(animatePointer);
}

function hidePointer() {
  delete document.documentElement.dataset.pointerActive;
}

function initializeObserver() {
  state.observer?.disconnect();
  const targets = [...document.querySelectorAll<HTMLElement>('[data-reveal], [data-timeline-item]')];
  if (!targets.length) return;

  if (state.reduced || !('IntersectionObserver' in window)) {
    targets.forEach((element) => {
      if (element.matches('[data-reveal]')) element.dataset.revealed = 'true';
      if (element.matches('[data-timeline-item]')) {
        element.dataset.active = 'true';
        element.closest<HTMLElement>('.archive-timeline')?.style.setProperty('--timeline-progress', '1');
      }
    });
    return;
  }

  state.observer = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const element = entry.target as HTMLElement;
      if (element.matches('[data-reveal]')) element.dataset.revealed = 'true';
      if (element.matches('[data-timeline-item]')) {
        element.dataset.active = 'true';
        const timeline = element.closest<HTMLElement>('.archive-timeline');
        if (timeline) {
          const items = [...timeline.querySelectorAll('[data-timeline-item]')];
          const progress = (items.indexOf(element) + 1) / Math.max(items.length, 1);
          timeline.style.setProperty('--timeline-progress', String(progress));
        }
      }
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  targets.forEach((element) => state.observer?.observe(element));
}

function initializeCounters() {
  document.querySelectorAll<HTMLElement>('[data-count]').forEach((element) => {
    const final = Number(element.dataset.count || 0);
    if (!Number.isFinite(final) || state.reduced || element.dataset.counted === 'true') return;
    const started = performance.now();
    const duration = 560;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = String(Math.round(final * eased)).padStart(2, '0');
      if (progress < 1) requestAnimationFrame(tick);
      else element.dataset.counted = 'true';
    };
    requestAnimationFrame(tick);
  });
}

function initializePage() {
  document.documentElement.classList.add('motion-ready');
  if (motionLevel() === 'reading') {
    document.querySelectorAll<HTMLElement>('.article-prose img').forEach((image) => {
      image.dataset.reveal = '';
      image.classList.add('reading-image');
    });
  }
  initializeObserver();
  initializeCounters();
}

export function initializeMotion() {
  initializePage();
  if (state.initialized) return;
  state.initialized = true;
  document.addEventListener('pointerdown', createInk, { passive: true });
  document.addEventListener('pointermove', trackPointer, { passive: true });
  document.documentElement.addEventListener('mouseleave', hidePointer);
  document.addEventListener('visibilitychange', () => { if (document.hidden) hidePointer(); });
  const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const pointerQuery = matchMedia('(hover: hover) and (pointer: fine)');
  reducedQuery.addEventListener('change', (event) => {
    state.reduced = event.matches;
    if (state.reduced) hidePointer();
    initializePage();
  });
  pointerQuery.addEventListener('change', (event) => {
    state.finePointer = event.matches;
    if (!state.finePointer) hidePointer();
  });
  document.addEventListener('astro:page-load', initializePage);
}
