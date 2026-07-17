import { defineOnce, css } from './utils.js';
import { icon } from './icons.js';
import { t } from '../lib/i18n.js';

const style = css`
  /* Shadow DOM doesn't inherit the light-DOM box-sizing reset from base.css. */
  *, *::before, *::after { box-sizing: border-box; }
  :host {
    display: block;
  }
  .row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: var(--space-4);
  }
  a, .disabled {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-4);
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border);
    background: var(--color-bg-raised);
    text-decoration: none;
    color: var(--color-text);
    min-width: 0;
    transition: border-color var(--duration-fast) var(--ease-standard),
      transform var(--duration-fast) var(--ease-standard);
  }
  a:hover {
    border-color: var(--color-primary);
    transform: translateY(-2px);
  }
  .disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .next {
    text-align: end;
    flex-direction: row-reverse;
  }
  .icon-badge {
    flex: none;
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    border-radius: var(--radius-pill);
    background: var(--color-bg-sunken);
    color: var(--color-text-muted);
  }
  .text {
    min-width: 0;
  }
  .label {
    display: block;
    font-size: var(--fs-100);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-text-muted);
  }
  .target {
    display: block;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  /* Chevrons are authored assuming an LTR baseline (prev points to the
     start/left, next to the end/right) and mirrored for RTL. :dir() reads
     the host's own inherited directionality and — unlike an outer
     [dir="rtl"] selector — works from inside a shadow root. */
  .icon-flip { display: inline-flex; }
  :host(:dir(rtl)) .icon-flip { transform: scaleX(-1); }
`;

/**
 * <pager-nav
 *   prev-href="#" prev-target="القسم السابق"
 *   next-href="#" next-target="القسم التالي">
 * </pager-nav>
 * Omit prev-href/next-href to render that side disabled (start/end of book).
 */
class PagerNav extends HTMLElement {
  static get observedAttributes() {
    return ['prev-href', 'prev-target', 'next-href', 'next-target'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `<style>${style}</style><nav class="row"></nav>`;
    this._row = this.shadowRoot.querySelector('.row');
    this._render();
    this._onLangChange = () => this._render();
    document.addEventListener('langchange', this._onLangChange);
  }

  disconnectedCallback() {
    document.removeEventListener('langchange', this._onLangChange);
  }

  attributeChangedCallback() {
    if (this._row) this._render();
  }

  _render() {
    const prevHref = this.getAttribute('prev-href');
    const nextHref = this.getAttribute('next-href');
    const prevTarget = this.getAttribute('prev-target') ?? t('pager.previousPlaceholder');
    const nextTarget = this.getAttribute('next-target') ?? t('pager.nextPlaceholder');

    const side = (href, target, label, iconName, extraClass) => {
      const tag = href ? 'a' : 'span';
      const hrefAttr = href ? `href="${href}"` : '';
      const cls = href ? extraClass : `disabled ${extraClass}`;
      return `
        <${tag} class="${cls}" ${hrefAttr}>
          <span class="icon-badge icon-flip">${icon(iconName)}</span>
          <span class="text">
            <span class="label">${label}</span>
            <span class="target">${target}</span>
          </span>
        </${tag}>
      `;
    };

    this._row.innerHTML =
      side(prevHref, prevTarget, t('pager.previous'), 'chevronLeft', 'prev') +
      side(nextHref, nextTarget, t('pager.next'), 'chevronRight', 'next');
  }
}

defineOnce('pager-nav', PagerNav);
