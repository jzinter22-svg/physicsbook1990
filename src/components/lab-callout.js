import { defineOnce, css } from './utils.js';
import { t } from '../lib/i18n.js';

const VARIANTS = {
  note: { icon: 'ℹ️', color: 'var(--color-primary)', bg: 'var(--color-primary-soft)', labelKey: 'callout.note.label' },
  warning: { icon: '⚠️', color: 'var(--color-warning)', bg: 'var(--color-warning-soft)', labelKey: 'callout.warning.label' },
  experiment: { icon: '⚗️', color: 'var(--color-success)', bg: 'var(--color-success-soft)', labelKey: 'callout.experiment.label' },
};

const style = css`
  :host {
    display: block;
    --callout-color: currentColor;
  }
  .box {
    display: flex;
    gap: var(--space-3);
    align-items: flex-start;
    background: var(--bg);
    color: var(--color-text);
    border-radius: var(--radius-md);
    padding: var(--space-4) var(--space-5);
  }
  .icon {
    flex: none;
    font-size: var(--fs-500);
    line-height: 1;
  }
  .label {
    font-weight: 700;
    color: var(--accent-color);
    margin-block-end: var(--space-1);
    font-size: var(--fs-200);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .content {
    font-size: var(--fs-300);
    line-height: var(--lh-normal);
  }
  ::slotted(*) {
    margin: 0;
  }
`;

/**
 * <lab-callout variant="note|warning|experiment" label="Custom label (optional)">
 *   body content
 * </lab-callout>
 */
class LabCallout extends HTMLElement {
  static get observedAttributes() {
    return ['variant', 'label'];
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
    const variant = VARIANTS[this.getAttribute('variant')] ?? VARIANTS.note;
    const label = this.getAttribute('label') ?? t(variant.labelKey);

    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <div class="box lab-callout" style="--bg:${variant.bg}; --callout-color:${variant.color}">
        <div class="icon" aria-hidden="true">${variant.icon}</div>
        <div>
          <div class="label" style="--accent-color:${variant.color}">${label}</div>
          <div class="content"><slot></slot></div>
        </div>
      </div>
    `;
  }
}

defineOnce('lab-callout', LabCallout);
