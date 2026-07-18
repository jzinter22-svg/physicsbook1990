import { defineOnce, css, html } from './utils.js';

const style = css`
  /* Shadow DOM doesn't inherit the light-DOM box-sizing reset from base.css. */
  *, *::before, *::after { box-sizing: border-box; }
  :host {
    display: block;
    background: var(--color-bg-raised);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-5);
    box-shadow: var(--shadow-sm);
    transition: box-shadow var(--duration-normal) var(--ease-standard),
      transform var(--duration-normal) var(--ease-standard);
  }
  :host([interactive]) {
    cursor: pointer;
  }
  :host([interactive]:hover) {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }
  .icon {
    font-size: var(--fs-600);
    margin-block-end: var(--space-3);
  }
  ::slotted(h3), .title {
    margin: 0 0 var(--space-2);
    font-size: var(--fs-500);
  }
  .body {
    color: var(--color-text-muted);
    font-size: var(--fs-300);
    line-height: var(--lh-normal);
  }
`;

/**
 * <ui-card icon="⚗️" heading="...">body text or markup</ui-card>
 * Slots: default (body), "heading" (optional rich heading override).
 */
class UiCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const icon = this.getAttribute('icon');
    const heading = this.getAttribute('heading');

    this.shadowRoot.innerHTML = html`
      <style>${style}</style>
      ${icon ? `<div class="icon" aria-hidden="true">${icon}</div>` : ''}
      <slot name="heading">${heading ? `<h3 class="title">${heading}</h3>` : ''}</slot>
      <div class="body"><slot></slot></div>
    `;
  }
}

defineOnce('ui-card', UiCard);
