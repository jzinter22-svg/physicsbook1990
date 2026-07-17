import { defineOnce, css } from './utils.js';
import { t } from '../lib/i18n.js';

const style = css`
  :host {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--color-ink-900);
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow-md);
  }
  .viewport {
    position: relative;
    width: 100%;
    flex: 1;
    min-height: 0;
  }
  ::slotted(*) {
    color: var(--color-ink-50);
  }
  .controls {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    background: var(--color-ink-800);
    border-block-start: 1px solid var(--color-ink-700);
  }
  button {
    appearance: none;
    border: 1px solid var(--color-ink-600);
    background: var(--color-ink-700);
    color: var(--color-ink-50);
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-4);
    font-size: var(--fs-200);
    font-weight: 600;
    cursor: pointer;
    transition: border-color var(--duration-fast) var(--ease-standard);
  }
  button:hover {
    border-color: var(--color-lab-cyan-300);
  }
  button[data-active='true'] {
    border-color: var(--color-lab-cyan-300);
    color: var(--color-lab-cyan-300);
  }
`;

/**
 * <sim-container class="sim-frame"></sim-container>
 * Generic chrome (viewport + start/pause/reset) around a `Simulation` instance.
 * Attach the simulation with `simContainer.mount(new MySimulation(simContainer.viewport))`.
 */
class SimContainer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    /** @type {import('../lib/simulation.js').Simulation | null} */
    this.simulation = null;
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <div class="viewport"><slot></slot></div>
      <div class="controls">
        <button id="start-pause" type="button"></button>
        <button id="reset" type="button"></button>
      </div>
    `;
    this.viewport = this.shadowRoot.querySelector('.viewport');
    this._startPauseBtn = this.shadowRoot.getElementById('start-pause');
    this._resetBtn = this.shadowRoot.getElementById('reset');

    this._startPauseBtn.addEventListener('click', () => this._toggle());
    this._resetBtn.addEventListener('click', () => this.simulation?.reset());

    this._updateStrings();
    this._onLangChange = () => this._updateStrings();
    document.addEventListener('langchange', this._onLangChange);
  }

  disconnectedCallback() {
    document.removeEventListener('langchange', this._onLangChange);
    this.simulation?.destroy();
  }

  /** @param {import('../lib/simulation.js').Simulation} simulation */
  mount(simulation) {
    this.simulation = simulation;
    this._updateStrings();
  }

  _toggle() {
    if (!this.simulation) return;
    if (this.simulation.running) this.simulation.pause();
    else this.simulation.start();
    this._updateStrings();
  }

  _updateStrings() {
    const running = this.simulation?.running ?? false;
    this._startPauseBtn.textContent = running ? t('sim.demo.pause') : t('sim.demo.start');
    this._startPauseBtn.dataset.active = String(running);
    this._resetBtn.textContent = t('sim.demo.reset');
  }
}

defineOnce('sim-container', SimContainer);
