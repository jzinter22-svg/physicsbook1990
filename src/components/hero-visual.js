import { defineOnce, css } from './utils.js';
import './particle-field.js';

const style = css`
  /* Shadow DOM doesn't inherit the light-DOM box-sizing reset from base.css. */
  *, *::before, *::after { box-sizing: border-box; }
  :host {
    position: relative;
    display: block;
    width: 100%;
    aspect-ratio: 4 / 3;
    border-radius: var(--radius-lg);
    overflow: hidden;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    box-shadow: var(--glass-shadow);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
  }
  .glow {
    position: absolute;
    inset: -20%;
    background: var(--glow-primary), var(--glow-accent);
    filter: blur(6px);
  }
  particle-field {
    z-index: 1;
  }
  svg {
    position: relative;
    z-index: 2;
    width: 78%;
    height: 78%;
    margin: 11% auto;
    display: block;
    overflow: visible;
  }
  .ring {
    fill: none;
    stroke-width: 1.4;
    transform-origin: 100px 100px;
  }
  .ring-1, .ring-2, .ring-3 {
    animation-play-state: var(--anim-play, running);
  }
  .ring-1 { stroke: var(--color-lab-cyan-500); opacity: 0.75; animation-name: spin; animation-duration: 16s; animation-timing-function: linear; animation-iteration-count: infinite; }
  .ring-2 { stroke: var(--color-lab-violet-500); opacity: 0.65; animation-name: spin; animation-duration: 22s; animation-timing-function: linear; animation-iteration-count: infinite; animation-direction: reverse; }
  .ring-3 { stroke: var(--color-lab-amber-500); opacity: 0.6; animation-name: spin; animation-duration: 28s; animation-timing-function: linear; animation-iteration-count: infinite; }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .electron {
    fill: var(--color-white);
  }
  .nucleus {
    fill: url(#nucleus-glow);
    animation: pulse 3.2s ease-in-out infinite;
    animation-play-state: var(--anim-play, running);
  }
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.08); }
  }
`;

/**
 * <hero-visual></hero-visual>
 * Decorative "Interactive Science Lab" hero illustration: an orbiting-electron
 * SVG over a glass panel, soft glow blobs, and a floating-particle layer.
 * Purely presentational — aria-hidden.
 */
class HeroVisual extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.setAttribute('aria-hidden', 'true');
    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <div class="glow"></div>
      <particle-field count="18" color="var(--color-lab-cyan-300)"></particle-field>
      <svg viewBox="0 0 200 200">
        <defs>
          <radialGradient id="nucleus-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="var(--color-lab-cyan-100)" />
            <stop offset="55%" stop-color="var(--color-lab-cyan-500)" />
            <stop offset="100%" stop-color="var(--color-lab-cyan-700)" />
          </radialGradient>
        </defs>
        <g class="ring ring-1">
          <ellipse cx="100" cy="100" rx="88" ry="34" />
          <circle class="electron" cx="188" cy="100" r="4" />
        </g>
        <g class="ring ring-2">
          <ellipse cx="100" cy="100" rx="88" ry="34" transform="rotate(60 100 100)" />
          <circle class="electron" cx="12" cy="100" r="4" transform="rotate(60 100 100)" />
        </g>
        <g class="ring ring-3">
          <ellipse cx="100" cy="100" rx="88" ry="34" transform="rotate(120 100 100)" />
          <circle class="electron" cx="188" cy="100" r="4" transform="rotate(120 100 100)" />
        </g>
        <circle class="nucleus" cx="100" cy="100" r="14" />
      </svg>
    `;
  }
}

defineOnce('hero-visual', HeroVisual);
