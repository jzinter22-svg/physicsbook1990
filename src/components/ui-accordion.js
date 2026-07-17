import { defineOnce, css } from './utils.js';
import { icon } from './icons.js';

const itemStyle = css`
  /* Shadow DOM doesn't inherit the light-DOM box-sizing reset from base.css. */
  *, *::before, *::after { box-sizing: border-box; }
  :host {
    display: block;
    border-block-end: 1px solid var(--color-border);
  }
  :host(:first-child) {
    border-block-start: 1px solid var(--color-border);
  }
  button {
    width: 100%;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-4) var(--space-2);
    background: none;
    border: none;
    font: inherit;
    font-weight: 600;
    color: var(--color-text);
    text-align: start;
    cursor: pointer;
  }
  button svg {
    flex: none;
    transition: transform var(--duration-fast) var(--ease-standard);
  }
  button[aria-expanded='true'] svg {
    transform: rotate(180deg);
  }
  .label {
    flex: 1;
  }
  .panel {
    overflow: hidden;
    max-height: 0;
    transition: max-height var(--duration-normal) var(--ease-standard);
  }
  .panel-inner {
    padding: 0 var(--space-2) var(--space-4);
    color: var(--color-text-muted);
    font-size: var(--fs-300);
    line-height: var(--lh-normal);
  }
`;

/** <ui-accordion-item label="...">body content</ui-accordion-item> */
export class UiAccordionItem extends HTMLElement {
  static get observedAttributes() {
    return ['label', 'open'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>${itemStyle}</style>
      <button type="button" aria-expanded="false">
        <span class="label"></span>
        ${icon('chevronDown')}
      </button>
      <div class="panel"><div class="panel-inner"><slot></slot></div></div>
    `;
    this._button = this.shadowRoot.querySelector('button');
    this._panel = this.shadowRoot.querySelector('.panel');
    this._button.addEventListener('click', () => this.toggle());
    this._render();
  }

  attributeChangedCallback() {
    if (this._button) this._render();
  }

  get open() {
    return this.hasAttribute('open');
  }

  set open(value) {
    this.toggleAttribute('open', Boolean(value));
  }

  toggle() {
    this.open = !this.open;
    if (this.open) {
      this.dispatchEvent(new CustomEvent('accordion-item-open', { bubbles: true }));
    }
  }

  _render() {
    this._button.querySelector('.label').textContent = this.getAttribute('label') ?? '';
    this._button.setAttribute('aria-expanded', String(this.open));
    // scrollHeight measures the panel's real content height even while
    // clipped by max-height:0, so the transition can animate to/from it.
    this._panel.style.maxHeight = this.open ? `${this._panel.scrollHeight}px` : '0px';
  }
}

const groupStyle = css`
  *, *::before, *::after { box-sizing: border-box; }
  :host {
    display: block;
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border);
    overflow: hidden;
    background: var(--color-bg-raised);
  }
  ::slotted(ui-accordion-item:first-child) {
    border-block-start: none !important;
  }
  ::slotted(ui-accordion-item:last-child) {
    border-block-end: none !important;
  }
`;

/**
 * <ui-accordion single>
 *   <ui-accordion-item label="...">...</ui-accordion-item>
 * </ui-accordion>
 * `single` restricts to one open item at a time.
 */
export class UiAccordion extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `<style>${groupStyle}</style><slot></slot>`;
    this.addEventListener('accordion-item-open', (event) => {
      if (!this.hasAttribute('single')) return;
      this.querySelectorAll(':scope > ui-accordion-item').forEach((item) => {
        if (item !== event.target) item.open = false;
      });
    });
  }
}

defineOnce('ui-accordion-item', UiAccordionItem);
defineOnce('ui-accordion', UiAccordion);
