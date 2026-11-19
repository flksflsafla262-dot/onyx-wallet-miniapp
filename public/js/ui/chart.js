// Dependency-free SVG charts: sparkline + interactive scrubbable line chart.
import { haptic } from '../core/telegram.js';
import { nextId } from '../core/dom.js';

/** Monotone cubic interpolation (Fritsch–Carlson): smooth, never overshoots. */
export function smoothPath(pts) {
  const n = pts.length;
  if (n < 2) return '';
  const dx = [], dy = [], m = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1][0] - pts[i][0];
    dy[i] = pts[i + 1][1] - pts[i][1];
    m[i] = dy[i] / (dx[i] || 1);
  }
  const t = [m[0]];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  t[n - 1] = m[n - 2];
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
    const a = t[i] / m[i], b = t[i + 1] / m[i];
    const s = a * a + b * b;
    if (s > 9) { const k = 3 / Math.sqrt(s); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
  }
  let d = `M${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += `C${(pts[i][0] + h).toFixed(2)},${(pts[i][1] + t[i] * h).toFixed(2)} ${(pts[i + 1][0] - h).toFixed(2)},${(pts[i + 1][1] - t[i + 1] * h).toFixed(2)} ${pts[i + 1][0].toFixed(2)},${pts[i + 1][1].toFixed(2)}`;
  }
  return d;
}

/** Tiny inline sparkline → SVG string. */
export function sparkline(values, { w = 64, h = 30, up } = {}) {
  if (!values || values.length < 2) return '';
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 3 - ((v - min) / span) * (h - 6)]);
  const trendUp = up ?? values[values.length - 1] >= values[0];
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true" style="color:var(${trendUp ? '--pos' : '--neg'})"><path d="${smoothPath(pts)}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;
}

/**
 * Interactive area chart.
 * mountChart(container, series[{t,p}], { height, onScrub(point|null, index), label(point) })
 */
export function mountChart(container, series, opts = {}) {
  const gid = nextId('cg');
  let data = series;
  let w = 0, h = opts.height || container.clientHeight || 160;
  let pts = [];
  let lastIdx = -1;
  let destroyed = false;

  container.innerHTML = `
    <svg role="img" aria-label="${opts.aria || 'Price chart'}" style="color:var(--tc,var(--pos))">
      <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".28"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>
      <path class="chart-area" fill="url(#${gid})"/>
      <path class="chart-line" pathLength="1"/>
      <circle class="chart-live-ring" r="4"/><circle class="chart-live" r="4"/>
      <g class="chart-scrub" opacity="0"><line class="chart-cross" y1="0"/><circle class="chart-dot" r="5.5"/></g>
    </svg>
    <div class="chart-tip" aria-hidden="true"></div>`;
  const svg = container.querySelector('svg');
  const area = svg.querySelector('.chart-area');
  const line = svg.querySelector('.chart-line');
  const scrub = svg.querySelector('.chart-scrub');
  const cross = svg.querySelector('.chart-cross');
  const dot = svg.querySelector('.chart-dot');
  const tip = container.querySelector('.chart-tip');
  const live = svg.querySelector('.chart-live');
  const liveRing = svg.querySelector('.chart-live-ring');

  function layout() {
    w = container.clientWidth;
    h = container.clientHeight || h;
    if (!w || !data?.length) return;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const ps = data.map((d) => d.p);
    let min = Math.min(...ps), max = Math.max(...ps);
    if (max - min < max * 1e-6) { min -= max * 0.001; max += max * 0.001; }
    const padT = h * 0.12, padB = h * 0.1;
    pts = data.map((d, i) => [(i / (data.length - 1)) * w, padT + (1 - (d.p - min) / (max - min)) * (h - padT - padB)]);
    const d = smoothPath(pts);
    line.setAttribute('d', d);
    area.setAttribute('d', `${d}L${w},${h}L0,${h}Z`);
    cross.setAttribute('y2', h);
    const end = pts[pts.length - 1];
    [live, liveRing].forEach((c) => { c.setAttribute('cx', Math.min(end[0], w - 9)); c.setAttribute('cy', end[1]); });
    container.dataset.trend = data[data.length - 1].p >= data[0].p ? 'up' : 'down';
    container.style.setProperty('--tc', data[data.length - 1].p >= data[0].p ? 'var(--pos)' : 'var(--neg)');
  }

  function animateIn() {
    container.classList.remove('is-drawn');
    void container.offsetWidth;
    requestAnimationFrame(() => container.classList.add('is-drawn'));
  }

  function showAt(clientX) {
    const r = container.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - r.left, 0), r.width);
    const i = Math.round((x / r.width) * (data.length - 1));
    const p = pts[i];
    if (!p) return;
    scrub.setAttribute('opacity', '1');
    cross.setAttribute('x1', p[0]); cross.setAttribute('x2', p[0]);
    dot.setAttribute('cx', p[0]); dot.setAttribute('cy', p[1]);
    if (opts.label) {
      tip.textContent = opts.label(data[i]);
      const tw = tip.offsetWidth || 90;
      tip.style.transform = `translateX(${Math.min(Math.max(p[0] - tw / 2, 8), w - tw - 8)}px)`;
      tip.classList.add('on');
    }
    if (i !== lastIdx) { lastIdx = i; haptic.select(); opts.onScrub?.(data[i], i); }
  }
  function hide() {
    scrub.setAttribute('opacity', '0');
    tip.classList.remove('on');
    if (lastIdx !== -1) { lastIdx = -1; opts.onScrub?.(null, -1); }
  }

  let active = false;
  container.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    active = true;
    container.setPointerCapture?.(e.pointerId);
    showAt(e.clientX);
  });
  container.addEventListener('pointermove', (e) => { if (active || e.pointerType === 'mouse') showAt(e.clientX); });
  const end = () => { active = false; hide(); };
  container.addEventListener('pointerup', end);
  container.addEventListener('pointercancel', end);
  container.addEventListener('pointerleave', () => { if (!active) hide(); });
  container.addEventListener('lostpointercapture', end);

  const ro = new ResizeObserver(() => { if (!destroyed && container.clientWidth !== w) layout(); });
  ro.observe(container);

  layout();
  animateIn();

  return {
    update(next) { data = next; lastIdx = -1; layout(); animateIn(); },
    destroy() { destroyed = true; ro.disconnect(); },
  };
}
