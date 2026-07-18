import { defineOnce, css } from './utils.js';
import { formatUnit } from '../engine/units.js';

const style = css`
  /* Shadow DOM doesn't inherit the light-DOM box-sizing reset from base.css. */
  *, *::before, *::after { box-sizing: border-box; }
  :host {
    display: inline;
    font-variant-numeric: tabular-nums;
  }
`;

/**
 * <unit-label unit="m/s^2"></unit-label> -> "m/s²"
 * <unit-label unit="kg*m/s"></unit-label> -> "kg·m/s"
 * A small, composable formatter used inside <sim-value-display> and
 * anywhere else a unit needs consistent notation (exponents, middle dot).
 */
class UnitLabel extends HTMLElement {
  static get observedAttributes() {
    return ['unit'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `<style>${style}</style><span></span>`;
    this._render();
  }

  attributeChangedCallback() {
    if (this.shadowRoot.firstElementChild) this._render();
  }

  _render() {
    this.shadowRoot.querySelector('span').textContent = formatUnit(this.getAttribute('unit'));
  }
}

defineOnce('unit-label', UnitLabel);
