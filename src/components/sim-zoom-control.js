import { defineOnce, css } from './utils.js';
import { t } from '../lib/i18n.js';

const style = css`
  /* Shadow DOM doesn't inherit the light-DOM box-sizing reset from base.css. */
  *, *::before, *::after { box-sizing: border-box; }
  :host {
    display: inline-flex;
    gap: var(--space-2);
  }
  button {
    appearance: none;
    border: 1px solid var(--color-border);
    background: var(--color-bg-raised);
    color: var(--color-text);
    border-radius: var(--radius-pill);
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
    transition: border-color var(--duration-fast) var(--ease-standard);
  }
  button:hover {
    border-color: var(--color-primary);
  }
`;

/**
 * <sim-zoom-control></sim-zoom-control>
 * Three buttons (zoom in / zoom out / reset) dispatching bubbling
 * "sim-zoom-in" / "sim-zoom-out" / "sim-zoom-reset" CustomEvents — pair
 * with the same `onZoom`-style handler used by attachZoom() in
 * src/engine/interactions/zoom.js for a consistent keyboard-reachable
 * alternative to wheel/pinch zoom.
 */
class SimZoomControl extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <button type="button" id="out">−</button>
      <button type="button" id="reset">⟳</button>
      <button type="button" id="in">+</button>
    `;
    this.shadowRoot.getElementById('in').addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('sim-zoom-in', { bubbles: true }));
    });
    this.shadowRoot.getElementById('out').addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('sim-zoom-out', { bubbles: true }));
    });
    this.shadowRoot.getElementById('reset').addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('sim-zoom-reset', { bubbles: true }));
    });
    this._render();
    this._onLangChange = () => this._render();
    document.addEventListener('langchange', this._onLangChange);
  }

  disconnectedCallback() {
    document.removeEventListener('langchange', this._onLangChange);
  }

  _render() {
    this.shadowRoot.getElementById('in').setAttribute('aria-label', t('sim.zoomIn'));
    this.shadowRoot.getElementById('out').setAttribute('aria-label', t('sim.zoomOut'));
    this.shadowRoot.getElementById('reset').setAttribute('aria-label', t('sim.zoomReset'));
  }
}

defineOnce('sim-zoom-control', SimZoomControl);
