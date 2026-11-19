// Global motion helpers: staggered scroll-reveal for rows and pointer tilt.
const SEL = '.list > .row, .list > .opt, .stats > .stat, .day-label';

let io;
function observe(node) {
  if (node._rv) return;
  node._rv = true;
  const parent = node.parentElement;
  const idx = parent ? Array.prototype.indexOf.call(parent.children, node) : 0;
  node.style.setProperty('--rd', String(Math.min(idx, 9)));
  node.classList.add('rv');
  io.observe(node);
}

function scan(root) {
  if (root.nodeType !== 1) return;
  if (root.matches?.(SEL)) observe(root);
  root.querySelectorAll?.(SEL).forEach(observe);
}

export function initMotion() {
  io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const n = e.target;
      io.unobserve(n);
      requestAnimationFrame(() => {
        n.classList.add('in-view');
        // drop helper classes afterwards so normal hover/press transitions return
        setTimeout(() => { n.classList.remove('rv', 'in-view'); n.style.removeProperty('--rd'); }, 1500);
      });
    }
  }, { rootMargin: '0px 0px -4% 0px', threshold: 0.05 });

  const mo = new MutationObserver((muts) => {
    for (const m of muts) m.addedNodes.forEach(scan);
  });
  ['screens', 'sheets'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) { mo.observe(el, { childList: true, subtree: true }); scan(el); }
  });

  // pointer tilt (mouse/pen only) for [data-tilt]
  document.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const el = e.target.closest?.('[data-tilt]');
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(700px) rotateY(${px * 10}deg) rotateX(${-py * 10}deg) scale(1.01)`;
  });
  document.addEventListener('pointerout', (e) => {
    const el = e.target.closest?.('[data-tilt]');
    if (el && !el.contains(e.relatedTarget)) el.style.transform = '';
  });
}
