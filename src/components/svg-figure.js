import { defineOnce, css } from './utils.js';
import { icon } from './icons.js';
import { t } from '../lib/i18n.js';
import { attachDrag } from '../engine/interactions/drag.js';
import { attachZoom } from '../engine/interactions/zoom.js';

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const PAN_LIMIT = 1200;

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
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border-radius: var(--radius-pill);
    border: 1px solid var(--color-border);
    background: var(--color-bg-raised);
    color: var(--color-text-muted);
    cursor: pointer;
  }
  .expand-btn:hover {
    color: var(--color-primary);
    border-color: var(--color-primary);
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

  /* ---- Fullscreen viewer ---- */
  .lightbox {
    position: fixed;
    inset: 0;
    z-index: var(--z-modal);
    display: none;
    opacity: 0;
    transition: opacity var(--duration-normal) var(--ease-standard);
  }
  :host([data-lightbox-open='true']) .lightbox {
    display: block;
  }
  :host([data-lightbox-open='true']) .lightbox.is-visible {
    opacity: 1;
  }
  .lightbox-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(6, 11, 18, 0.82);
  }
  .lightbox-toolbar {
    position: absolute;
    top: var(--space-4);
    inset-inline: var(--space-4);
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    pointer-events: none;
  }
  .lightbox-toolbar > * {
    pointer-events: auto;
  }
  .zoom-group {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    background: rgba(18, 27, 44, 0.6);
    border-radius: var(--radius-pill);
    padding: var(--space-2);
  }
  .zoom-btn, .lightbox-close {
    appearance: none;
    border: 1px solid rgba(255, 255, 255, 0.25);
    background: rgba(255, 255, 255, 0.08);
    color: var(--color-ink-50);
    border-radius: var(--radius-pill);
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    cursor: pointer;
    font-size: var(--fs-500);
    line-height: 1;
    transition: background var(--duration-fast) var(--ease-standard);
  }
  .zoom-btn:hover, .lightbox-close:hover {
    background: rgba(255, 255, 255, 0.18);
  }
  .zoom-level {
    min-width: 4ch;
    text-align: center;
    color: var(--color-ink-50);
    font-variant-numeric: tabular-nums;
    font-size: var(--fs-200);
    font-weight: 700;
  }
  .lightbox-viewport {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    touch-action: none;
    padding: var(--space-8) var(--space-5);
  }
  .lightbox-stage {
    /* A definite (non-shrink-to-fit) box is what makes the slotted SVG
       actually render at a real size — see the ARCHITECTURE.md postmortem
       for why an ambiguously-sized SVG inside a flex item with no explicit
       width collapsed the whole viewer to 0x0 before this fix. */
    width: min(85vw, 1000px);
    height: min(78vh, 800px);
    cursor: grab;
    will-change: transform;
  }
  .lightbox-stage[data-dragging='true'] {
    cursor: grabbing;
  }
  .lightbox-svg {
    width: 100%;
    height: 100%;
  }
  .lightbox-svg svg {
    width: 100%;
    height: 100%;
    display: block;
  }
  .lightbox-hint {
    position: absolute;
    bottom: var(--space-4);
    inset-inline: 0;
    text-align: center;
    color: rgba(255, 255, 255, 0.6);
    font-size: var(--fs-100);
    pointer-events: none;
  }
`;

/**
 * <svg-figure number="1" caption="..." sim-target="#sim-circular">
 *   <svg>...</svg>
 * </svg-figure>
 * A reusable frame for SVG figures: consistent padding/border, an auto
 * figure number + caption, and a click-to-enlarge fullscreen viewer with
 * zoom (buttons, wheel, pinch) and drag-to-pan. If `sim-target` points to an
 * interactive simulation covering the same concept, the expand button
 * scrolls to and highlights that instead of opening a static image — the
 * interactive version always wins over a picture of the same thing.
 */
class SvgFigure extends HTMLElement {
  static get observedAttributes() {
    return ['number', 'caption'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._zoom = 1;
    this._panX = 0;
    this._panY = 0;
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
        <div class="lightbox-toolbar">
          <div class="zoom-group">
            <button class="zoom-btn" data-action="out" type="button">−</button>
            <span class="zoom-level">100%</span>
            <button class="zoom-btn" data-action="in" type="button">+</button>
            <button class="zoom-btn" data-action="reset" type="button">${icon('reset')}</button>
          </div>
          <button class="lightbox-close" type="button">${icon('close')}</button>
        </div>
        <div class="lightbox-viewport">
          <div class="lightbox-stage">
            <div class="lightbox-svg"></div>
          </div>
        </div>
        <p class="lightbox-hint"></p>
      </div>
    `;
    this._figcaption = this.shadowRoot.querySelector('figcaption');
    this._expandBtn = this.shadowRoot.querySelector('.expand-btn');
    this._lightbox = this.shadowRoot.querySelector('.lightbox');
    this._lightboxSvg = this.shadowRoot.querySelector('.lightbox-svg');
    this._stage = this.shadowRoot.querySelector('.lightbox-stage');
    this._viewport = this.shadowRoot.querySelector('.lightbox-viewport');
    this._zoomLevelEl = this.shadowRoot.querySelector('.zoom-level');
    this._hintEl = this.shadowRoot.querySelector('.lightbox-hint');

    this._expandBtn.addEventListener('click', () => this._openLightbox());
    this.shadowRoot.querySelector('.lightbox-backdrop').addEventListener('click', () => this._closeLightbox());
    this.shadowRoot.querySelector('.lightbox-close').addEventListener('click', () => this._closeLightbox());
    this.shadowRoot.querySelectorAll('.zoom-btn').forEach((btn) => {
      btn.addEventListener('click', () => this._onZoomButton(btn.dataset.action));
    });

    this._onKeydown = (event) => {
      if (event.key === 'Escape' && this.dataset.lightboxOpen === 'true') this._closeLightbox();
    };
    document.addEventListener('keydown', this._onKeydown);

    this._detachDrag = attachDrag(this._stage, {
      onStart: () => {
        this._stage.dataset.dragging = 'true';
      },
      onDrag: (_event, { dx, dy }) => {
        this._panX = Math.min(PAN_LIMIT, Math.max(-PAN_LIMIT, this._panX + dx));
        this._panY = Math.min(PAN_LIMIT, Math.max(-PAN_LIMIT, this._panY + dy));
        this._applyTransform();
      },
      onEnd: () => {
        this._stage.dataset.dragging = 'false';
      },
    });
    this._detachZoom = attachZoom(this._viewport, {
      onZoom: (factor) => this._setZoom(this._zoom * factor),
    });

    this._render();
    this._onLangChange = () => this._render();
    document.addEventListener('langchange', this._onLangChange);
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this._onKeydown);
    document.removeEventListener('langchange', this._onLangChange);
    this._detachDrag?.();
    this._detachZoom?.();
  }

  attributeChangedCallback() {
    if (this._figcaption) this._render();
  }

  _openLightbox() {
    const simTarget = this.getAttribute('sim-target');
    if (simTarget) {
      const target = document.querySelector(simTarget);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.animate(
          [{ boxShadow: '0 0 0 4px var(--color-primary)' }, { boxShadow: '0 0 0 4px transparent' }],
          { duration: 900, easing: 'ease-out' }
        );
        return;
      }
    }

    const original = this.querySelector('svg');
    if (original) this._lightboxSvg.replaceChildren(original.cloneNode(true));
    this._zoom = 1;
    this._panX = 0;
    this._panY = 0;
    this._applyTransform();
    this.dataset.lightboxOpen = 'true';
    this._expandBtn.setAttribute('aria-expanded', 'true');
    // Two ticks: display:none -> block must land before the opacity
    // transition starts, or the fade never plays.
    requestAnimationFrame(() => requestAnimationFrame(() => this._lightbox.classList.add('is-visible')));
  }

  _closeLightbox() {
    this._lightbox.classList.remove('is-visible');
    this.dataset.lightboxOpen = 'false';
    this._expandBtn.setAttribute('aria-expanded', 'false');
  }

  _onZoomButton(action) {
    if (action === 'in') this._setZoom(this._zoom * 1.4);
    else if (action === 'out') this._setZoom(this._zoom / 1.4);
    else {
      this._panX = 0;
      this._panY = 0;
      this._setZoom(1);
    }
  }

  _setZoom(value) {
    this._zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
    if (this._zoom === MIN_ZOOM) {
      this._panX = 0;
      this._panY = 0;
    }
    this._applyTransform();
  }

  _applyTransform() {
    this._stage.style.transform = `translate(${this._panX}px, ${this._panY}px) scale(${this._zoom})`;
    this._zoomLevelEl.textContent = `${Math.round(this._zoom * 100)}%`;
  }

  _render() {
    const number = this.getAttribute('number');
    const caption = this.getAttribute('caption') ?? t('figure.caption');
    this._figcaption.innerHTML = number
      ? `<span class="fig-number">${t('figure.number')} ${number}</span> — ${caption}`
      : caption;
    this._expandBtn.setAttribute('aria-label', t('figure.expand'));
    if (this._hintEl) this._hintEl.textContent = t('figure.viewerHint');
  }
}

defineOnce('svg-figure', SvgFigure);
