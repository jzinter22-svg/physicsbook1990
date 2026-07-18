import { defineOnce, css } from './utils.js';
import { icon } from './icons.js';
import { t } from '../lib/i18n.js';

const style = css`
  /* Shadow DOM doesn't inherit the light-DOM box-sizing reset from base.css. */
  *, *::before, *::after { box-sizing: border-box; }
  :host {
    display: inline-block;
  }
  button {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    appearance: none;
    border: 1px solid var(--glass-border);
    background: var(--glass-bg);
    backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
    -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
    color: var(--color-text);
    border-radius: var(--radius-pill);
    padding: var(--space-2) var(--space-4);
    font: inherit;
    font-weight: 700;
    font-size: var(--fs-200);
    cursor: pointer;
    transition: border-color var(--duration-glass) var(--ease-standard),
      box-shadow var(--duration-glass) var(--ease-standard);
  }
  button:hover {
    border-color: var(--color-primary);
    box-shadow: var(--glow-hover);
  }
  button svg {
    width: 1em;
    height: 1em;
  }
`;

/**
 * <sim-play-toggle></sim-play-toggle>
 * Dispatches bubbling "sim-play" / "sim-pause" CustomEvents on click — a
 * standalone control usable with any engine (SimulationEngine, a bare
 * FrameLoop, or a hand-rolled loop), not coupled to <sim-container>.
 * Reflects state via the `playing` boolean property/attribute, which
 * external code should also set if the engine's state changes elsewhere
 * (e.g. it auto-pauses).
 */
class SimPlayToggle extends HTMLElement {
  static get observedAttributes() {
    return ['playing'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `<style>${style}</style><button type="button"></button>`;
    this._button = this.shadowRoot.querySelector('button');
    this._button.addEventListener('click', () => {
      this.playing = !this.playing;
      this.dispatchEvent(new CustomEvent(this.playing ? 'sim-play' : 'sim-pause', { bubbles: true }));
    });
    this._render();
    this._onLangChange = () => this._render();
    document.addEventListener('langchange', this._onLangChange);
  }

  disconnectedCallback() {
    document.removeEventListener('langchange', this._onLangChange);
  }

  attributeChangedCallback() {
    if (this._button) this._render();
  }

  get playing() {
    return this.hasAttribute('playing');
  }

  set playing(value) {
    this.toggleAttribute('playing', Boolean(value));
  }

  _render() {
    const playing = this.playing;
    this._button.innerHTML = `${icon(playing ? 'pause' : 'play')}<span></span>`;
    this._button.querySelector('span').textContent = t(playing ? 'sim.pause' : 'sim.play');
    this._button.setAttribute('aria-pressed', String(playing));
  }
}

defineOnce('sim-play-toggle', SimPlayToggle);
