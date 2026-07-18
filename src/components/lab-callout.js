import { defineOnce, css } from './utils.js';
import { icon } from './icons.js';
import { t } from '../lib/i18n.js';

const VARIANTS = {
  note: { icon: 'ℹ️', color: 'var(--color-primary)', bg: 'var(--color-primary-soft)', labelKey: 'callout.note.label' },
  warning: { icon: '⚠️', color: 'var(--color-warning)', bg: 'var(--color-warning-soft)', labelKey: 'callout.warning.label' },
  experiment: { icon: '⚗️', color: 'var(--color-success)', bg: 'var(--color-success-soft)', labelKey: 'callout.experiment.label' },
};

const style = css`
  /* Shadow DOM doesn't inherit the light-DOM box-sizing reset from base.css. */
  *, *::before, *::after { box-sizing: border-box; }
  :host {
    display: block;
    --callout-color: currentColor;
  }
  .box {
    display: flex;
    gap: var(--space-4);
    align-items: flex-start;
    background: var(--bg);
    color: var(--color-text);
    border-radius: var(--radius-lg);
    padding: var(--space-5) var(--space-6);
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
  .head-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  .toggle-btn {
    margin-inline-start: auto;
    flex: none;
    appearance: none;
    border: none;
    background: none;
    color: var(--accent-color);
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    cursor: pointer;
    border-radius: var(--radius-pill);
  }
  .toggle-btn:hover {
    background: color-mix(in srgb, var(--accent-color) 12%, transparent);
  }
  .toggle-btn svg {
    transition: transform var(--duration-fast) var(--ease-standard);
  }
  :host([data-collapsed='true']) .toggle-btn svg {
    transform: rotate(-90deg);
  }
  [dir='rtl'] :host([data-collapsed='true']) .toggle-btn svg {
    transform: rotate(90deg);
  }
  :host([data-collapsed='true']) .content {
    display: none;
  }
`;

/**
 * <lab-callout variant="note|warning|experiment" label="Custom label (optional)">
 *   body content
 * </lab-callout>
 *
 * Add `collapsible` (optionally with `collapsed` to start closed) to turn
 * a supplementary aside — "did you know?", "remember", "think" — into a
 * one-tap reveal instead of a permanently-open panel. This is what keeps a
 * lesson's core flow (title/objectives/visualization/explanation/examples/
 * exercises/summary) as the one thing in focus, per the calm-UI rebuild's
 * progressive-disclosure requirement, without deleting any of the
 * textbook-sourced enrichment content itself — it's still all there, one
 * tap away.
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
    if (this.hasAttribute('collapsible')) {
      this.dataset.collapsed = this.hasAttribute('collapsed') ? 'true' : 'false';
    }
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

  _toggleCollapse() {
    const collapsed = this.dataset.collapsed === 'true';
    this.dataset.collapsed = String(!collapsed);
    this._toggleBtn?.setAttribute('aria-expanded', String(collapsed));
  }

  _render() {
    const variant = VARIANTS[this.getAttribute('variant')] ?? VARIANTS.note;
    const label = this.getAttribute('label') ?? t(variant.labelKey);
    const collapsible = this.hasAttribute('collapsible');

    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <div class="box lab-callout" style="--bg:${variant.bg}; --callout-color:${variant.color}">
        <div class="icon" aria-hidden="true">${variant.icon}</div>
        <div style="flex:1; min-width:0;">
          <div class="head-row">
            <div class="label" style="--accent-color:${variant.color}">${label}</div>
            ${collapsible ? `<button class="toggle-btn" type="button" aria-expanded="${this.dataset.collapsed !== 'true'}">${icon('chevronDown')}</button>` : ''}
          </div>
          <div class="content"><slot></slot></div>
        </div>
      </div>
    `;

    if (collapsible) {
      this._toggleBtn = this.shadowRoot.querySelector('.toggle-btn');
      this._toggleBtn.setAttribute('aria-label', t('card.expand'));
      this._toggleBtn.addEventListener('click', () => this._toggleCollapse());
    }
  }
}

defineOnce('lab-callout', LabCallout);
