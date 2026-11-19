// Celebration burst: sparkles + confetti flying out of an element.
export function burst(origin, { count = 34 } = {}) {
  const layer = document.getElementById('fx');
  if (!layer) return;
  const base = layer.getBoundingClientRect();
  const r = origin.getBoundingClientRect();
  const x = r.left - base.left + r.width / 2;
  const y = r.top - base.top + r.height / 2;
  const colors = ['#ffffff', '#ffffff', '#32d74b', '#a4a4ae', '#e8e8ee', '#7be58f'];
  for (let i = 0; i < count; i++) {
    const s = document.createElement('i');
    s.className = 'fx-dot';
    const ang = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const dist = 90 + Math.random() * 150;
    const rect = Math.random() > 0.55;
    const size = 5 + Math.random() * 6;
    s.style.cssText = [
      `--x:${x}px`, `--y:${y}px`,
      `--dx:${Math.cos(ang) * dist}px`, `--dy:${Math.sin(ang) * dist - 50}px`,
      `--r:${(Math.random() - 0.5) * 720}deg`,
      `--c:${colors[i % colors.length]}`,
      `--w:${rect ? size * 0.6 : size}px`, `--h:${rect ? size * 1.5 : size}px`,
      `--br:${rect ? '2px' : '50%'}`,
      `--t:${900 + Math.random() * 700}ms`,
    ].join(';');
    layer.appendChild(s);
    s.addEventListener('animationend', () => s.remove(), { once: true });
  }
}
