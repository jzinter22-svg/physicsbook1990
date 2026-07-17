import { defineOnce, css } from './utils.js';
import { icon } from './icons.js';
import { t } from '../lib/i18n.js';

const style = css`
  /* Shadow DOM doesn't inherit the light-DOM box-sizing reset from base.css. */
  *, *::before, *::after { box-sizing: border-box; }
  :host {
    display: block;
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    margin-block-end: var(--space-4);
  }
  h3 {
    margin: 0;
    font-size: var(--fs-400);
  }
  .toggle-btn {
    appearance: none;
    border: 1px solid var(--color-border);
    background: var(--color-bg-sunken);
    color: var(--color-text-muted);
    border-radius: var(--radius-pill);
    padding: var(--space-1) var(--space-3);
    font-size: var(--fs-100);
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    cursor: pointer;
  }
  .row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 3fr) auto;
    align-items: center;
    gap: var(--space-3);
    padding-block: var(--space-2);
  }
  .row-label {
    font-size: var(--fs-200);
    color: var(--color-text-muted);
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .track {
    height: 14px;
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
  .row-value {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-size: var(--fs-200);
    font-weight: 700;
    min-width: 3.5ch;
    text-align: end;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--fs-300);
  }
  table[hidden], .chart-body[hidden] {
    display: none;
  }
  th, td {
    padding: var(--space-2) var(--space-3);
    text-align: start;
    border-block-end: 1px solid var(--color-border);
  }
  th {
    color: var(--color-text-muted);
    font-size: var(--fs-100);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  td {
    font-variant-numeric: tabular-nums;
  }
`;

/**
 * <data-chart title="..." unit="m/s"></data-chart>
 * Generic single-series bar chart TEMPLATE — no data is bundled. Set
 * `chartEl.data = [{ label, value }, ...]` from calling code.
 * Sequential single-hue bars (magnitude is the default job per the dataviz
 * form heuristic — this is not a categorical/multi-series chart), direct
 * value labels, and a toggle to an equivalent <table> per the accessibility
 * requirement that a table view always exists alongside a chart.
 */
class DataChart extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._data = [];
    this._showTable = false;
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <div class="head">
        <h3></h3>
        <button class="toggle-btn" type="button"></button>
      </div>
      <div class="chart-body"></div>
      <table hidden>
        <thead><tr><th class="th-label"></th><th class="th-value"></th></tr></thead>
        <tbody></tbody>
      </table>
    `;
    this._titleEl = this.shadowRoot.querySelector('h3');
    this._toggleBtn = this.shadowRoot.querySelector('.toggle-btn');
    this._chartBody = this.shadowRoot.querySelector('.chart-body');
    this._table = this.shadowRoot.querySelector('table');

    this._toggleBtn.addEventListener('click', () => {
      this._showTable = !this._showTable;
      this._renderView();
    });

    this._render();
    this._onLangChange = () => this._render();
    document.addEventListener('langchange', this._onLangChange);
  }

  disconnectedCallback() {
    document.removeEventListener('langchange', this._onLangChange);
  }

  get data() {
    return this._data;
  }

  set data(rows) {
    this._data = Array.isArray(rows) ? rows : [];
    if (this._chartBody) this._render();
  }

  _render() {
    this._titleEl.textContent = this.getAttribute('title') ?? '';
    this._titleEl.hidden = !this.getAttribute('title');
    this.shadowRoot.querySelector('.th-label').textContent = t('chart.categoryLabel');
    this.shadowRoot.querySelector('.th-value').textContent = this.getAttribute('unit') ?? '';
    this._renderView();
  }

  _renderView() {
    this._toggleBtn.innerHTML = `${icon('table')}<span></span>`;
    this._toggleBtn.querySelector('span').textContent = this._showTable ? t('card.collapse') : t('card.expand');
    this._chartBody.hidden = this._showTable;
    this._table.hidden = !this._showTable;

    const unit = this.getAttribute('unit') ?? '';
    const max = Math.max(1, ...this._data.map((row) => row.value));

    this._chartBody.innerHTML = this._data
      .map(
        (row) => `
          <div class="row">
            <span class="row-label">${row.label}</span>
            <span class="track"><span class="fill" style="width:${(row.value / max) * 100}%"></span></span>
            <span class="row-value">${row.value}${unit}</span>
          </div>
        `
      )
      .join('');

    this._table.querySelector('tbody').innerHTML = this._data
      .map((row) => `<tr><td>${row.label}</td><td>${row.value}${unit}</td></tr>`)
      .join('');
  }
}

defineOnce('data-chart', DataChart);
