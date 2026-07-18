import { defineOnce, css } from './utils.js';
import { icon } from './icons.js';
import { t } from '../lib/i18n.js';

const style = css`
  /* Shadow DOM doesn't inherit the light-DOM box-sizing reset from base.css. */
  *, *::before, *::after { box-sizing: border-box; }
  :host {
    display: block;
  }
  .tile {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-5);
    border-radius: var(--radius-lg);
    background:
      radial-gradient(120% 60% at 0% 0%, color-mix(in srgb, var(--color-primary) 6%, transparent), transparent 60%),
      var(--glass-bg-strong);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    border: 1px solid var(--glass-border);
    box-shadow: var(--shadow-card);
  }
  .icon-badge {
    flex: none;
    width: 44px;
    height: 44px;
    border-radius: var(--radius-md);
    display: grid;
    place-items: center;
    background: var(--color-primary-soft);
    color: var(--color-primary);
    font-size: 1.2rem;
  }
  .value {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-weight: 800;
    font-size: var(--fs-600);
    line-height: 1;
    color: var(--color-text);
  }
  .label {
    font-size: var(--fs-200);
    color: var(--color-text-muted);
    margin-top: var(--space-1);
  }
`;

/** <stat-tile icon="chart" value="0" label-key="progress.stat.completed"></stat-tile> */
class StatTile extends HTMLElement {
  static get observedAttributes() {
    return ['value'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this._render();
    this._onLangChange = () => this._render();
    document.addEventListener('langchange', this._onLangChange);
  }

  disconnectedCallback() {
    document.removeEventListener('langchange', this._onLangChange);
  }

  attributeChangedCallback() {
    if (this.shadowRoot.innerHTML) this._render();
  }

  _render() {
    const iconName = this.getAttribute('icon') ?? 'chart';
    const value = this.getAttribute('value') ?? '0';
    const labelKey = this.getAttribute('label-key');

    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <div class="tile">
        <div class="icon-badge">${icon(iconName)}</div>
        <div>
          <div class="value">${value}</div>
          <div class="label">${labelKey ? t(labelKey) : ''}</div>
        </div>
      </div>
    `;
  }
}

defineOnce('stat-tile', StatTile);
