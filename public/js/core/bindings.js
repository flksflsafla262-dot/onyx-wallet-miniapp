// Live text bindings: any element with data-bind="kind:ID" is refreshed on price ticks.
import { state } from './state.js';
import { fmtFiat, fmtAmount, fmtPct, trendClass, MASK } from './format.js';
import { tween } from './dom.js';

const hide = () => state.settings.hideBalance;

export function applyBindings(root = document) {
  root.querySelectorAll('[data-bind]').forEach((node) => {
    const [kind, id] = node.dataset.bind.split(':');
    const a = state.byId[id];
    if (!a) return;
    const bal = state.balances[id] || 0;
    let text;
    let num;
    switch (kind) {
      case 'price': num = a.price; text = fmtFiat(a.price); break;
      case 'value': {
        num = bal * a.price;
        text = fmtFiat(num, { hide: hide() });
        if (node._n === undefined && !hide() && num > 0) {
          // first paint: count up from zero
          node._n = num;
          node._busy = true;
          tween(0, num, { duration: 1000, onUpdate: (v) => { node.textContent = fmtFiat(v); }, onDone: () => { node._busy = false; node.textContent = fmtFiat(node._n); } });
          return;
        }
        if (node._busy) { node._n = num; return; }
        break;
      }
      case 'bal': text = hide() ? MASK : `${fmtAmount(bal, a.decimals)} ${a.symbol}`; break;
      case 'chg': {
        text = fmtPct(a.change24h);
        const c = trendClass(a.change24h);
        node.classList.remove('pos', 'neg', 'flat');
        node.classList.add(c);
        break;
      }
      default: return;
    }
    if (node.textContent !== text) {
      const prev = node._n;
      node.textContent = text;
      if (kind === 'price' && prev != null && num !== prev) {
        node.classList.remove('flash-up', 'flash-down');
        void node.offsetWidth;
        node.classList.add(num > prev ? 'flash-up' : 'flash-down');
      }
    }
    node._n = num;
  });
}
