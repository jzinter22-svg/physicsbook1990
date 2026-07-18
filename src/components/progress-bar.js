import { defineOnce, css } from './utils.js';

const style = css`
  /* Shadow DOM doesn't inherit the light-DOM box-sizing reset from base.css. */
  *, *::before, *::after { box-sizing: border-box; }
  :host {
    display: block;
  }
  .label-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: var(--fs-200);
    margin-block-end: var(--space-2);
  }
  .label {
    color: var(--color-text-muted);
    font-weight: 600;
  }
  .value {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-text);
    font-weight: 700;
  }
  .track {
    height: 10px;
    border-radius: var(--radius-pill);
    background: var(--color-primary-soft);
    overflow: hidden;
  }
  .fill {
    height: 100%;
    border-radius: var(--radius-pill);
    background: var(--color-primary);
    transition: width var(--duration-slow) var(--ease-standard);
  }
`;

/** <progress-bar value="60" label="التقدم"></progress-bar> — a single-ratio meter. */
class ProgressBar extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'label'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <div class="label-row">
        <span class="label"></span>
        <span class="value"></span>
      </div>
      <div class="track"><div class="fill"></div></div>
    `;
    this._fill = this.shadowRoot.querySelector('.fill');
    this._labelEl = this.shadowRoot.querySelector('.label');
    this._valueEl = this.shadowRoot.querySelector('.value');
    this._render();
  }

  attributeChangedCallback() {
    if (this._fill) this._render();
  }

  _render() {
    const value = Math.max(0, Math.min(100, Number(this.getAttribute('value') ?? 0)));
    const label = this.getAttribute('label');
    this._fill.style.width = `${value}%`;
    this._valueEl.textContent = `${value}%`;
    this._labelEl.textContent = label ?? '';
    this._labelEl.hidden = !label;
    this.setAttribute('role', 'progressbar');
    this.setAttribute('aria-valuenow', String(value));
    this.setAttribute('aria-valuemin', '0');
    this.setAttribute('aria-valuemax', '100');
  }
}

defineOnce('progress-bar', ProgressBar);
