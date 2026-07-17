import { defineOnce, css } from './utils.js';
import { prefersReducedMotion } from '../lib/motion.js';

const style = css`
  /* Shadow DOM doesn't inherit the light-DOM box-sizing reset from base.css. */
  *, *::before, *::after { box-sizing: border-box; }
  :host {
    display: block;
  }
  figure {
    margin: 0;
  }
  .viewport {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: var(--radius-lg);
    overflow: hidden;
    background: var(--color-ink-900);
  }
  figcaption {
    margin-block-start: var(--space-3);
    font-size: var(--fs-200);
    color: var(--color-text-muted);
    text-align: center;
  }
`;

/**
 * <canvas-figure caption="..."></canvas-figure>
 * A decorative (non-interactive, no play/pause chrome) canvas animation
 * frame — the lighter sibling of <sim-container>, for illustrating a
 * concept rather than letting the reader drive it. Attach with
 * `figureEl.mount(new MySimulation(figureEl.viewport))`; auto-starts unless
 * the visitor has reduced motion enabled, in which case it renders one
 * still frame.
 */
class CanvasFigure extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.simulation = null;
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <figure>
        <div class="viewport"></div>
        <figcaption></figcaption>
      </figure>
    `;
    this.viewport = this.shadowRoot.querySelector('.viewport');
    this._figcaption = this.shadowRoot.querySelector('figcaption');
    this._render();
  }

  attributeChangedCallback() {
    if (this._figcaption) this._render();
  }

  static get observedAttributes() {
    return ['caption'];
  }

  /** @param {import('../lib/simulation.js').Simulation} simulation */
  mount(simulation) {
    this.simulation = simulation;
    if (prefersReducedMotion()) simulation.render(simulation.ctx);
    else simulation.start();
  }

  disconnectedCallback() {
    this.simulation?.destroy();
  }

  _render() {
    const caption = this.getAttribute('caption') ?? '';
    this._figcaption.textContent = caption;
    this._figcaption.hidden = !caption;
  }
}

defineOnce('canvas-figure', CanvasFigure);
