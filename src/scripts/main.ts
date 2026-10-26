type SiteData = { timezone: string; hours: { day: string; closed?: boolean; ranges?: { open: string; close: string }[] }[] };

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => Array.from(root.querySelectorAll<T>(sel));

/* ── Split headlines into animatable words ── */
$$('.split').forEach((el) => {
  const walk = (node: Node, counter: { i: number }): DocumentFragment => {
    const frag = document.createDocumentFragment();
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        (child.textContent ?? '').split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) return frag.append(' ');
          const w = document.createElement('span');
          w.className = 'w';
          const inner = document.createElement('span');
          inner.style.setProperty('--i', String(counter.i++));
          inner.textContent = part;
          w.append(inner);
          frag.append(w);
        });
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const clone = (child as Element).cloneNode(false) as Element;
        clone.append(walk(child, counter));
        frag.append(clone);
      }
    });
    return frag;
  };
  const label = el.textContent?.trim() ?? '';
  const frag = walk(el, { i: 0 });
  el.setAttribute('aria-label', label);
  el.replaceChildren(frag);
  $$('.w', el).forEach((w) => w.setAttribute('aria-hidden', 'true'));
});

/* ── Scroll reveal ── */
$$('[data-stagger]').forEach((parent) => {
  const step = Number(parent.dataset.stagger) || 90;
  $$('[data-reveal]', parent).forEach((child, i) => {
    if (!child.style.getPropertyValue('--d')) child.style.setProperty('--d', `${i * step}ms`);
  });
});
const revealTargets = $$('[data-reveal], .split');
if (reduce || !('IntersectionObserver' in window)) {
  revealTargets.forEach((el) => el.classList.add('is-visible'));
} else {
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } }),
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
  );
  revealTargets.forEach((el) => io.observe(el));
}

/* ── Nav: solid on scroll, hide on scroll down, mobile panel ── */
const nav = document.querySelector<HTMLElement>('[data-nav]');
const burger = document.querySelector<HTMLButtonElement>('[data-burger]');
const panel = document.querySelector<HTMLElement>('[data-panel]');
const bar = document.querySelector<HTMLElement>('[data-mobile-bar]');
let lastY = window.scrollY;
const onScroll = () => {
  const y = window.scrollY;
  nav?.classList.toggle('is-scrolled', y > 24);
  if (nav && !nav.classList.contains('menu-open')) nav.classList.toggle('is-hidden', y > lastY && y > 480);
  bar?.classList.toggle('is-on', y > 360);
  lastY = y;
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

const setMenu = (open: boolean) => {
  if (!burger || !panel || !nav) return;
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  nav.classList.toggle('menu-open', open);
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) { panel.hidden = false; requestAnimationFrame(() => panel.classList.add('open')); }
  else { panel.classList.remove('open'); setTimeout(() => { if (!panel.classList.contains('open')) panel.hidden = true; }, 700); }
};
burger?.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
panel?.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('a')) setMenu(false); });
window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && burger?.getAttribute('aria-expanded') === 'true') { setMenu(false); burger.focus(); } });
window.matchMedia('(min-width: 961px)').addEventListener('change', (m) => { if (m.matches) setMenu(false); });

/* ── Count-up numbers ── */
$$('[data-count]').forEach((el) => {
  const target = Number(el.dataset.count);
  const isYear = el.dataset.format === 'year';
  const suffix = el.dataset.suffix ?? '';
  if (reduce) { el.textContent = (isYear ? String(target) : target.toLocaleString()) + suffix; return; }
  const run = () => {
    const start = isYear ? target - 40 : 0;
    const t0 = performance.now();
    const dur = 1600;
    const tick = (t: number) => {
      const p = Math.min((t - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      const v = Math.round(start + (target - start) * eased);
      el.textContent = (isYear ? String(v) : v.toLocaleString()) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { run(); io.disconnect(); } }), { threshold: 0.6 });
  io.observe(el);
});

/* ── Open-now status + highlight today ── */
(() => {
  const raw = document.getElementById('site-data')?.textContent;
  if (!raw) return;
  const data: SiteData = JSON.parse(raw);
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: data.timezone, weekday: 'long', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const today = get('weekday');
  const mins = (Number(get('hour')) % 24) * 60 + Number(get('minute'));
  const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const fmt = (t: string) => { const [h, m] = t.split(':').map(Number); const hr = h % 12 || 12; return `${hr}${m ? ':' + String(m).padStart(2, '0') : ''} ${h >= 12 ? 'pm' : 'am'}`; };

  const idx = data.hours.findIndex((d) => d.day === today);
  const todayHours = data.hours[idx];
  let text = 'Hours vary';
  let open = false;
  const current = todayHours?.ranges?.find((r) => mins >= toMin(r.open) && mins < toMin(r.close));
  if (current) { open = true; text = `Open now · until ${fmt(current.close)}`; }
  else {
    const laterToday = todayHours?.ranges?.find((r) => toMin(r.open) > mins);
    if (laterToday) text = `Closed · opens today at ${fmt(laterToday.open)}`;
    else {
      for (let i = 1; i <= 7; i++) {
        const d = data.hours[(idx + i) % 7];
        if (d.ranges?.length) { text = `Closed · opens ${i === 1 ? 'tomorrow' : d.day} at ${fmt(d.ranges[0].open)}`; break; }
      }
    }
  }
  $$('[data-open-status]').forEach((el) => {
    el.setAttribute('data-open', String(open));
    const t = el.querySelector('[data-open-text]'); if (t) t.textContent = text;
  });
  $$('[data-day]').forEach((el) => el.classList.toggle('today', el.dataset.day === today));
})();

/* ── Parallax + pointer effects (disabled for reduced motion) ── */
if (!reduce) {
  const px = $$('[data-parallax]');
  if (px.length) {
    let ticking = false;
    const update = () => {
      px.forEach((el) => {
        const rect = el.parentElement?.getBoundingClientRect() ?? el.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > innerHeight + 200) return;
        const speed = Number(el.dataset.parallax) || 0.1;
        el.style.transform = `translate3d(0, ${(rect.top + rect.height / 2 - innerHeight / 2) * -speed}px, 0)`;
      });
      ticking = false;
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  $$('[data-mouse-scope]').forEach((scope) => {
    const layers = $$('[data-mouse]', scope);
    scope.addEventListener('pointermove', (e) => {
      const r = scope.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      layers.forEach((l) => { const d = Number(l.dataset.mouse) || 10; l.style.setProperty('--mx', `${x * d}px`); l.style.setProperty('--my', `${y * d}px`); });
    });
  });

  if (window.matchMedia('(hover: hover)').matches) {
    $$('.tilt').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--ry', `${x * 9}deg`);
        card.style.setProperty('--rx', `${y * -9}deg`);
      });
      card.addEventListener('pointerleave', () => { card.style.setProperty('--ry', '0deg'); card.style.setProperty('--rx', '0deg'); });
    });
  }
}

/* ── Newsletter ── */
$$<HTMLFormElement>('[data-newsletter]').forEach((form) => {
  const input = form.querySelector<HTMLInputElement>('input[type=email]')!;
  const msg = form.querySelector<HTMLElement>('.news-msg')!;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
    input.classList.toggle('bad', !ok);
    input.setAttribute('aria-invalid', String(!ok));
    if (!ok) { msg.textContent = 'Please enter a valid email address.'; return; }
    // TODO: connect to your email provider (Mailchimp, Buttondown, etc.). See README.
    msg.textContent = 'Grazie! You’re on the list. 🍝';
    form.reset();
  });
});
