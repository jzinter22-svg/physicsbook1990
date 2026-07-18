import { defineOnce, css } from './utils.js';
import { icon } from './icons.js';
import { t } from '../lib/i18n.js';

const style = css`
  /* Shadow DOM doesn't inherit the light-DOM box-sizing reset from base.css. */
  *, *::before, *::after { box-sizing: border-box; }
  :host {
    display: block;
  }
  figure {
    margin: 0;
  }
  .frame {
    position: relative;
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border);
    background: var(--color-bg-sunken);
    padding: var(--space-5);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  ::slotted(svg) {
    max-width: 100%;
    height: auto;
  }
  .expand-btn {
    position: absolute;
    top: var(--space-3);
    inset-inline-end: var(--space-3);
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    border-radius: var(--radius-pill);
    border: 1px solid var(--glass-border);
    background: var(--glass-bg);
    backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
    -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
    color: var(--color-text-muted);
    cursor: pointer;
    transition: color var(--duration-glass) var(--ease-standard),
      border-color var(--duration-glass) var(--ease-standard),
      box-shadow var(--duration-glass) var(--ease-standard);
  }
  .expand-btn:hover {
    color: var(--color-primary);
    border-color: var(--color-primary);
    box-shadow: var(--glow-hover);
  }
  figcaption {
    margin-block-start: var(--space-3);
    font-size: var(--fs-200);
    color: var(--color-text-muted);
    text-align: center;
  }
  .fig-number {
    font-weight: 700;
    color: var(--color-text);
  }
  .lightbox {
    position: fixed;
    inset: 0;
    z-index: var(--z-modal);
    display: none;
    align-items: center;
    justify-content: center;
    padding: var(--layout-gutter);
  }
  :host([data-lightbox-open='true']) .lightbox {
    display: flex;
  }
  .lightbox-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(6, 11, 18, 0.7);
  }
  .lightbox-content {
    position: relative;
    max-width: 90vw;
    max-height: 90vh;
    background: var(--color-bg-raised);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    overflow: auto;
  }
  .lightbox-content svg {
    max-width: 100%;
    height: auto;
    display: block;
  }
  .lightbox-close {
    position: absolute;
    top: var(--space-3);
    inset-inline-end: var(--space-3);
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    border-radius: var(--radius-pill);
    border: 1px solid var(--glass-border);
    background: var(--glass-bg-strong);
    backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
    -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
    color: var(--color-text);
    cursor: pointer;
    transition: border-color var(--duration-glass) var(--ease-standard),
      box-shadow var(--duration-glass) var(--ease-standard);
  }
  .lightbox-close:hover {
    border-color: var(--color-primary);
    box-shadow: var(--glow-hover);
  }
`;

/**
 * <svg-figure number="1" caption="...">
 *   <svg>...</svg>
 * </svg-figure>
 * A reusable frame for SVG figures: consistent padding/border, an auto
 * figure number + caption, and a click-to-enlarge lightbox.
 */
class SvgFigure extends HTMLElement {
  static get observedAttributes() {
    return ['number', 'caption'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <figure>
        <div class="frame">
          <slot></slot>
          <button class="expand-btn" type="button">${icon('expand')}</button>
        </div>
        <figcaption></figcaption>
      </figure>
      <div class="lightbox">
        <div class="lightbox-backdrop"></div>
        <div class="lightbox-content">
          <button class="lightbox-close" type="button">${icon('close')}</button>
          <div class="lightbox-svg"></div>
        </div>
      </div>
    `;
    this._figcaption = this.shadowRoot.querySelector('figcaption');
    this._expandBtn = this.shadowRoot.querySelector('.expand-btn');
    this._lightboxSvg = this.shadowRoot.querySelector('.lightbox-svg');

    this._expandBtn.addEventListener('click', () => this._openLightbox());
    this.shadowRoot.querySelector('.lightbox-backdrop').addEventListener('click', () => this._closeLightbox());
    this.shadowRoot.querySelector('.lightbox-close').addEventListener('click', () => this._closeLightbox());
    this._onKeydown = (event) => {
      if (event.key === 'Escape' && this.dataset.lightboxOpen === 'true') this._closeLightbox();
    };
    document.addEventListener('keydown', this._onKeydown);

    this._render();
    this._onLangChange = () => this._render();
    document.addEventListener('langchange', this._onLangChange);
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this._onKeydown);
    document.removeEventListener('langchange', this._onLangChange);
  }

  attributeChangedCallback() {
    if (this._figcaption) this._render();
  }

  _openLightbox() {
    const original = this.querySelector('svg');
    if (original) this._lightboxSvg.replaceChildren(original.cloneNode(true));
    this.dataset.lightboxOpen = 'true';
    this._expandBtn.setAttribute('aria-expanded', 'true');
  }

  _closeLightbox() {
    this.dataset.lightboxOpen = 'false';
    this._expandBtn.setAttribute('aria-expanded', 'false');
  }

  _render() {
    const number = this.getAttribute('number');
    const caption = this.getAttribute('caption') ?? t('figure.caption');
    this._figcaption.innerHTML = number
      ? `<span class="fig-number">${t('figure.number')} ${number}</span> — ${caption}`
      : caption;
    this._expandBtn.setAttribute('aria-label', t('figure.expand'));
  }
}

defineOnce('svg-figure', SvgFigure);
