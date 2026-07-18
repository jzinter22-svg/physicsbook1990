import { defineOnce, css } from './utils.js';
import './math-block.js';

const style = css`
  /* Shadow DOM doesn't inherit the light-DOM box-sizing reset from base.css. */
  *, *::before, *::after { box-sizing: border-box; }
  :host {
    display: block;
  }
`;

/**
 * <sim-formula-display template="v = {v}\ \text{m/s}"></sim-formula-display>
 * el.values = { v: currentSpeed.toFixed(1) };
 *
 * A thin <math-block> wrapper for formulas that need live numbers plugged
 * in as a simulation runs (e.g. "watch the equation update while dragging
 * the slider") — `{name}` placeholders in `template` are substituted from
 * the `values` object and re-typeset via MathJax on every update.
 */
class SimFormulaDisplay extends HTMLElement {
  static get observedAttributes() {
    return ['template'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._values = {};
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `<style>${style}</style>`;
    this._mathBlock = document.createElement('math-block');
    this.shadowRoot.appendChild(this._mathBlock);
    this._render();
  }

  attributeChangedCallback() {
    if (this._mathBlock) this._render();
  }

  get values() {
    return this._values;
  }

  set values(next) {
    this._values = next ?? {};
    this._render();
  }

  _render() {
    const template = this.getAttribute('template') ?? '';
    const substituted = template.replace(/\{(\w+)\}/g, (match, key) =>
      key in this._values ? String(this._values[key]) : match
    );
    this._mathBlock.textContent = `\\[ ${substituted} \\]`;
  }
}

defineOnce('sim-formula-display', SimFormulaDisplay);
