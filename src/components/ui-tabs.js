import { defineOnce, css } from './utils.js';

const style = css`
  /* Shadow DOM doesn't inherit the light-DOM box-sizing reset from base.css. */
  *, *::before, *::after { box-sizing: border-box; }
  :host {
    display: block;
  }
  [role='tablist'] {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    border-bottom: 1px solid var(--color-border);
    margin-block-end: var(--space-4);
  }
  button[role='tab'] {
    appearance: none;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    padding: var(--space-3) var(--space-4);
    font-size: var(--fs-300);
    font-weight: 600;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: color var(--duration-fast) var(--ease-standard),
      border-color var(--duration-fast) var(--ease-standard);
  }
  button[role='tab']:hover {
    color: var(--color-text);
  }
  button[role='tab'][aria-selected='true'] {
    color: var(--color-primary);
    border-color: var(--color-primary);
  }
  ::slotted(ui-tab) {
    display: none;
  }
  ::slotted(ui-tab[active]) {
    display: block;
  }
`;

/**
 * <ui-tabs>
 *   <ui-tab label="شرح">...</ui-tab>
 *   <ui-tab label="أمثلة">...</ui-tab>
 * </ui-tabs>
 */
class UiTabs extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `<style>${style}</style><div role="tablist"></div><slot></slot>`;
    this._tablist = this.shadowRoot.querySelector('[role="tablist"]');
    this._buildTabs();
  }

  _buildTabs() {
    const panels = Array.from(this.querySelectorAll(':scope > ui-tab'));
    this._tablist.innerHTML = '';

    panels.forEach((panel, index) => {
      const id = panel.id || `tab-panel-${crypto.randomUUID()}`;
      panel.id = id;

      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-controls', id);
      button.textContent = panel.getAttribute('label') ?? `Tab ${index + 1}`;
      button.addEventListener('click', () => this._select(index));
      button.addEventListener('keydown', (event) => this._onKeydown(event, index));

      this._tablist.appendChild(button);
    });

    this._panels = panels;
    this._select(0);
  }

  _onKeydown(event, index) {
    const count = this._panels.length;
    if (event.key === 'ArrowRight') this._select((index + 1) % count, true);
    else if (event.key === 'ArrowLeft') this._select((index - 1 + count) % count, true);
  }

  _select(index, focus = false) {
    const buttons = Array.from(this._tablist.children);
    buttons.forEach((button, i) => {
      button.setAttribute('aria-selected', String(i === index));
      button.tabIndex = i === index ? 0 : -1;
    });
    this._panels.forEach((panel, i) => {
      if (i === index) panel.setAttribute('active', '');
      else panel.removeAttribute('active');
    });
    if (focus) buttons[index]?.focus();
  }
}

/** Content panel for <ui-tabs>. Intentionally has no shadow DOM — it's plain slotted content. */
class UiTab extends HTMLElement {}

defineOnce('ui-tabs', UiTabs);
defineOnce('ui-tab', UiTab);
