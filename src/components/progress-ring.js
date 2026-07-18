import { defineOnce, css } from './utils.js';

const style = css`
  /* Shadow DOM doesn't inherit the light-DOM box-sizing reset from base.css. */
  *, *::before, *::after { box-sizing: border-box; }
  :host {
    display: inline-block;
  }
  svg {
    display: block;
    transform: rotate(-90deg);
  }
  .track {
    stroke: var(--color-primary-soft);
    fill: none;
  }
  .fill {
    stroke: var(--color-primary);
    fill: none;
    stroke-linecap: round;
    transition: stroke-dashoffset var(--duration-slow) var(--ease-standard);
  }
  .center {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    transform: none;
  }
  .wrap {
    position: relative;
    display: inline-grid;
  }
  .value {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-weight: 700;
    font-size: var(--fs-500);
    color: var(--color-text);
  }
`;

/** <progress-ring value="35" size="120" stroke="10"></progress-ring> — a single-ratio meter. */
class ProgressRing extends HTMLElement {
  static get observedAttributes() {
    return ['value'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const size = Number(this.getAttribute('size') ?? 120);
    const stroke = Number(this.getAttribute('stroke') ?? 10);
    const radius = (size - stroke) / 2;
    this._circumference = 2 * Math.PI * radius;

    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <div class="wrap" style="width:${size}px; height:${size}px;">
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-hidden="true">
          <circle class="track" cx="${size / 2}" cy="${size / 2}" r="${radius}" stroke-width="${stroke}" />
          <circle class="fill" cx="${size / 2}" cy="${size / 2}" r="${radius}" stroke-width="${stroke}"
            stroke-dasharray="${this._circumference}" />
        </svg>
        <div class="center"><span class="value"></span></div>
      </div>
    `;

    this._fillCircle = this.shadowRoot.querySelector('.fill');
    this._valueLabel = this.shadowRoot.querySelector('.value');

    // Set the initial state with no transition so it doesn't visibly animate from 0 on load.
    this._fillCircle.style.transition = 'none';
    this._applyValue();
    requestAnimationFrame(() => {
      this._fillCircle.style.transition = '';
    });
  }

  attributeChangedCallback() {
    if (this._fillCircle) this._applyValue();
  }

  _applyValue() {
    const value = Math.max(0, Math.min(100, Number(this.getAttribute('value') ?? 0)));
    const offset = this._circumference * (1 - value / 100);
    this._fillCircle.style.strokeDashoffset = String(offset);
    this._valueLabel.textContent = `${value}%`;
    this.setAttribute('role', 'meter');
    this.setAttribute('aria-valuenow', String(value));
    this.setAttribute('aria-valuemin', '0');
    this.setAttribute('aria-valuemax', '100');
  }
}

defineOnce('progress-ring', ProgressRing);
