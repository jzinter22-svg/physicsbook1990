import { defineOnce, css } from './utils.js';

const style = css`
  /* Shadow DOM doesn't inherit the light-DOM box-sizing reset from base.css. */
  *, *::before, *::after { box-sizing: border-box; }
  :host {
    position: absolute;
    inset: 0;
    display: block;
    overflow: hidden;
    pointer-events: none;
    z-index: 0;
  }
  .particle {
    position: absolute;
    border-radius: 50%;
    background: radial-gradient(circle, var(--particle-color, var(--color-primary)) 0%, transparent 72%);
    animation: drift var(--dur, 14s) ease-in-out infinite alternate;
    animation-delay: var(--delay, 0s);
    animation-play-state: var(--anim-play, running);
    opacity: var(--op, 0.5);
  }
  @keyframes drift {
    from { transform: translate(0, 0); }
    to { transform: translate(var(--dx, 12px), var(--dy, -26px)); }
  }
`;

/** <particle-field count="24" color="var(--color-primary)"></particle-field> — decorative only, aria-hidden. */
class ParticleField extends HTMLElement {
  connectedCallback() {
    this.setAttribute('aria-hidden', 'true');
    this.attachShadow({ mode: 'open' });
    const count = Number(this.getAttribute('count') ?? 24);
    const color = this.getAttribute('color') ?? 'var(--color-primary)';

    let particles = '';
    for (let i = 0; i < count; i += 1) {
      const size = 2 + Math.random() * 5;
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      const dur = 10 + Math.random() * 14;
      const delay = -Math.random() * dur;
      const dx = (Math.random() - 0.5) * 40;
      const dy = -(20 + Math.random() * 40);
      const op = 0.25 + Math.random() * 0.45;
      particles += `<div class="particle" style="width:${size}px; height:${size}px; left:${left}%; top:${top}%; --dur:${dur}s; --delay:${delay}s; --dx:${dx}px; --dy:${dy}px; --op:${op}; --particle-color:${color};"></div>`;
    }

    this.shadowRoot.innerHTML = `<style>${style}</style>${particles}`;
  }
}

defineOnce('particle-field', ParticleField);
