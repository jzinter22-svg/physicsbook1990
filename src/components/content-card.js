import { defineOnce, css } from './utils.js';
import { icon } from './icons.js';
import { t } from '../lib/i18n.js';

const style = css`
  /* Shadow DOM doesn't inherit the light-DOM box-sizing reset from base.css. */
  *, *::before, *::after { box-sizing: border-box; }
  :host {
    display: block;
    --accent: var(--card-accent, var(--color-primary));
  }
  .card {
    border-radius: var(--radius-lg);
    background: var(--color-bg-raised);
    border: 1px solid var(--color-border);
    border-inline-start: 4px solid var(--accent);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
  }
  .head {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-4) var(--space-5);
  }
  .icon-badge {
    flex: none;
    width: 40px;
    height: 40px;
    border-radius: var(--radius-md);
    display: grid;
    place-items: center;
    background: color-mix(in srgb, var(--accent) 16%, transparent);
    color: var(--accent);
    font-size: 1.2rem;
  }
  .head-text {
    flex: 1;
    min-width: 0;
  }
  .type-label {
    display: block;
    font-size: var(--fs-100);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--accent);
  }
  .title {
    margin: 2px 0 0;
    font-size: var(--fs-500);
    line-height: var(--lh-tight);
  }
  .toggle-btn {
    flex: none;
    appearance: none;
    border: 1px solid var(--color-border);
    background: var(--color-bg-sunken);
    color: var(--color-text-muted);
    border-radius: var(--radius-pill);
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    cursor: pointer;
    transition: transform var(--duration-fast) var(--ease-standard);
  }
  /* A plain class selector setting display beats the UA stylesheet's
     [hidden] { display: none } at equal specificity (author origin wins) —
     restore it explicitly so the hidden attribute keeps working. */
  .toggle-btn[hidden] {
    display: none;
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
  .body {
    padding: 0 var(--space-5) var(--space-5);
    color: var(--color-text);
    font-size: var(--fs-300);
    line-height: var(--lh-normal);
  }
  .body :first-child { margin-block-start: 0; }
  .body :last-child { margin-block-end: 0; }
  :host([data-collapsed='true']) .body {
    display: none;
  }
  .footer {
    padding: var(--space-4) var(--space-5);
    border-block-start: 1px solid var(--color-border);
    background: var(--color-bg-sunken);
  }
  /* :empty never matches here — the <slot> element is itself always a child
     node of .footer, whether or not anything is actually assigned to it.
     Visibility is toggled from JS via the slot's "slotchange" event instead. */
  .footer[hidden] {
    display: none;
  }
`;

const CARD_HEAD_HTML = () => css`
  <style>${style}</style>
  <div class="card">
    <div class="head">
      <span class="icon-badge"></span>
      <div class="head-text">
        <span class="type-label"></span>
        <h3 class="title"></h3>
      </div>
      <button class="toggle-btn" type="button" hidden></button>
    </div>
    <div class="body"><slot></slot></div>
    <div class="footer"><slot name="footer"></slot></div>
  </div>
`;

/**
 * Base class for every content card variant. Subclasses set `static config`
 * to `{ icon, accent, labelKey }` and are registered under their own tag
 * name (see the bottom of this file) — e.g. <lesson-card title="...">.
 *
 * Optional attributes: `title`, `number` (e.g. "1.2"), `collapsible`.
 */
export class ContentCard extends HTMLElement {
  static config = { icon: 'book', accent: 'var(--color-primary)', labelKey: 'card.lesson.label' };

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = CARD_HEAD_HTML();
    this._iconBadge = this.shadowRoot.querySelector('.icon-badge');
    this._typeLabel = this.shadowRoot.querySelector('.type-label');
    this._titleEl = this.shadowRoot.querySelector('.title');
    this._toggleBtn = this.shadowRoot.querySelector('.toggle-btn');
    this._card = this.shadowRoot.querySelector('.card');
    this._footer = this.shadowRoot.querySelector('.footer');
    this._footerSlot = this.shadowRoot.querySelector('slot[name="footer"]');

    this._card.style.setProperty('--card-accent', this.constructor.config.accent);
    this._iconBadge.innerHTML = icon(this.constructor.config.icon);

    const syncFooterVisibility = () => {
      this._footer.hidden = this._footerSlot.assignedNodes({ flatten: true }).length === 0;
    };
    this._footerSlot.addEventListener('slotchange', syncFooterVisibility);
    syncFooterVisibility();

    if (this.hasAttribute('collapsible')) {
      this._toggleBtn.hidden = false;
      this._toggleBtn.innerHTML = icon('chevronDown');
      this.dataset.collapsed = this.hasAttribute('collapsed') ? 'true' : 'false';
      this._toggleBtn.addEventListener('click', () => this._toggleCollapse());
    }

    this._render();
    this._onLangChange = () => this._render();
    document.addEventListener('langchange', this._onLangChange);
  }

  disconnectedCallback() {
    document.removeEventListener('langchange', this._onLangChange);
  }

  _toggleCollapse() {
    const collapsed = this.dataset.collapsed === 'true';
    this.dataset.collapsed = String(!collapsed);
    this._toggleBtn.setAttribute('aria-expanded', String(collapsed));
    this._toggleBtn.setAttribute('aria-label', t(collapsed ? 'card.collapse' : 'card.expand'));
  }

  _render() {
    const label = t(this.constructor.config.labelKey);
    const number = this.getAttribute('number');
    this._typeLabel.textContent = number ? `${label} · ${number}` : label;
    this._titleEl.textContent = this.getAttribute('title') ?? '';
    this._titleEl.hidden = !this.getAttribute('title');
    if (this._toggleBtn.hidden === false) {
      const collapsed = this.dataset.collapsed === 'true';
      this._toggleBtn.setAttribute('aria-expanded', String(!collapsed));
      this._toggleBtn.setAttribute('aria-label', t(collapsed ? 'card.expand' : 'card.collapse'));
    }
  }
}

const VARIANTS = [
  ['lesson-card', { icon: 'book', accent: 'var(--color-primary)', labelKey: 'card.lesson.label' }],
  ['example-card', { icon: 'bulb', accent: 'var(--color-info)', labelKey: 'card.example.label' }],
  ['exercise-card', { icon: 'pencil', accent: 'var(--color-success)', labelKey: 'card.exercise.label' }],
  ['formula-card', { icon: 'sigma', accent: 'var(--color-accent)', labelKey: 'card.formula.label' }],
  ['note-card', { icon: 'info', accent: 'var(--color-primary)', labelKey: 'card.note.label' }],
  ['warning-card', { icon: 'alertTriangle', accent: 'var(--color-warning)', labelKey: 'card.warning.label' }],
  ['experiment-card', { icon: 'beaker', accent: 'var(--color-success)', labelKey: 'card.experiment.label' }],
  ['simulation-card', { icon: 'monitor', accent: 'var(--color-primary)', labelKey: 'card.simulation.label' }],
  ['quiz-card', { icon: 'target', accent: 'var(--color-accent)', labelKey: 'card.quiz.label' }],
  ['summary-card', { icon: 'listCheck', accent: 'var(--color-text-muted)', labelKey: 'card.summary.label' }],
  ['mindmap-card', { icon: 'tree', accent: 'var(--color-info)', labelKey: 'card.mindmap.label' }],
  ['glossary-card', { icon: 'bookOpen', accent: 'var(--color-text-muted)', labelKey: 'card.glossary.label' }],
];

for (const [tagName, config] of VARIANTS) {
  const Variant = class extends ContentCard {
    static config = config;
  };
  defineOnce(tagName, Variant);
}
