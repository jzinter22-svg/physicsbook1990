import { defineOnce, css } from './utils.js';
import { formatUnit } from '../engine/units.js';

const style = css`
  /* Shadow DOM doesn't inherit the light-DOM box-sizing reset from base.css. */
  *, *::before, *::after { box-sizing: border-box; }
  :host {
    display: inline-flex;
    align-items: baseline;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-md);
    background: var(--color-bg-sunken);
    border: 1px solid var(--color-border);
  }
  .label {
    font-size: var(--fs-200);
    color: var(--color-text-muted);
    font-weight: 600;
  }
  .value {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-weight: 700;
    font-size: var(--fs-400);
    color: var(--color-primary);
  }
  .unit {
    font-size: var(--fs-200);
    color: var(--color-text-muted);
  }
`;

/**
 * <sim-value-display label="Velocity" unit="m/s" precision="1"></sim-value-display>
 * Set live values via the `value` property (not just the attribute) so a
 * simulation's render loop can update it every frame without attribute
 * churn: `display.value = currentSpeed`.
 */
class SimValueDisplay extends HTMLElement {
  static get observedAttributes() {
    return ['label', 'unit', 'value', 'precision'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <span class="label"></span>
      <span class="value"></span>
      <span class="unit"></span>
    `;
    this.setAttribute('role', 'status');
    this._render();
  }

  attributeChangedCallback() {
    if (this.shadowRoot.firstElementChild) this._render();
  }

  get value() {
    return Number(this.getAttribute('value'));
  }

  set value(v) {
    this.setAttribute('value', String(v));
  }

  _render() {
    const label = this.getAttribute('label');
    const unit = this.getAttribute('unit');
    const precision = Number(this.getAttribute('precision') ?? 2);
    const raw = Number(this.getAttribute('value') ?? 0);

    const labelEl = this.shadowRoot.querySelector('.label');
    labelEl.textContent = label ?? '';
    labelEl.hidden = !label;

    this.shadowRoot.querySelector('.value').textContent = Number.isFinite(raw) ? raw.toFixed(precision) : '—';
    this.shadowRoot.querySelector('.unit').textContent = formatUnit(unit);
  }
}

defineOnce('sim-value-display', SimValueDisplay);
