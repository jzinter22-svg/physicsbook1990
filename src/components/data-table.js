import { defineOnce, css } from './utils.js';

const style = css`
  /* Shadow DOM doesn't inherit the light-DOM box-sizing reset from base.css. */
  *, *::before, *::after { box-sizing: border-box; }
  :host {
    display: block;
  }
  figure {
    margin: 0;
  }
  .scroll {
    overflow-x: auto;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
  }
  ::slotted(table) {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--fs-300);
    font-variant-numeric: tabular-nums;
  }
  ::slotted(caption) {
    caption-side: top;
    text-align: start;
    padding: var(--space-3) var(--space-4);
    font-size: var(--fs-200);
    color: var(--color-text-muted);
  }
  figcaption {
    margin-block-start: var(--space-3);
    font-size: var(--fs-200);
    color: var(--color-text-muted);
    text-align: center;
  }
`;

/*
  A <table> element's cells are real light-DOM nodes, so the zebra-striping /
  sticky-header / cell-padding rules below live in a document-level
  stylesheet (rtl.css) rather than this component's shadow root — ::slotted()
  only reaches direct slotted children, not descendants like <tr>/<td>.
*/

/**
 * <data-table caption="...">
 *   <table>
 *     <thead><tr><th>...</th></tr></thead>
 *     <tbody>...</tbody>
 *   </table>
 * </data-table>
 * A responsive, scroll-safe, sticky-header frame around a real semantic
 * <table> — the table stays slotted (light DOM) so colspans, multi-row
 * headers, etc. all just work natively.
 */
class DataTable extends HTMLElement {
  static get observedAttributes() {
    return ['caption'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.classList.add('data-table-host');
    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <figure>
        <div class="scroll"><slot></slot></div>
        <figcaption></figcaption>
      </figure>
    `;
    this._figcaption = this.shadowRoot.querySelector('figcaption');
    this._render();
  }

  attributeChangedCallback() {
    if (this._figcaption) this._render();
  }

  _render() {
    const caption = this.getAttribute('caption') ?? '';
    this._figcaption.textContent = caption;
    this._figcaption.hidden = !caption;
  }
}

defineOnce('data-table', DataTable);
