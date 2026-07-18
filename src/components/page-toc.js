import { defineOnce, css } from './utils.js';
import { icon } from './icons.js';
import { t } from '../lib/i18n.js';

const style = css`
  /* Shadow DOM doesn't inherit the light-DOM box-sizing reset from base.css. */
  *, *::before, *::after { box-sizing: border-box; }
  :host {
    display: block;
  }

  /*
    Off-canvas by default (Priority 3): a page's table of contents used to
    sit as a permanently-visible sticky column beside the lesson, eating
    into its reading width on desktop. It's now a drawer — hidden until the
    tab is pressed, sliding in from the *end* edge (opposite app-sidebar's
    start-edge drawer, so the two never visually collide), auto-closing the
    moment a section link is picked.
  */
  .tab {
    position: fixed;
    inset-inline-end: 0;
    top: 50%;
    transform: translateY(-50%);
    z-index: var(--z-overlay);
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-3);
    border-radius: var(--radius-md) 0 0 var(--radius-md);
    border: 1px solid var(--color-border);
    border-inline-end: none;
    background: var(--color-bg-raised);
    color: var(--color-text-muted);
    box-shadow: var(--shadow-md);
    cursor: pointer;
    writing-mode: vertical-rl;
  }
  .tab:hover {
    color: var(--color-primary);
  }
  .tab svg {
    writing-mode: horizontal-tb;
    width: 1.1em;
    height: 1.1em;
  }
  .panel {
    position: fixed;
    inset-block: 0;
    inset-inline-end: -320px;
    width: min(300px, 85vw);
    z-index: var(--z-modal);
    background: var(--color-bg-raised);
    border-inline-start: 1px solid var(--color-border);
    box-shadow: var(--shadow-lg);
    transition: inset-inline-end var(--duration-normal) var(--ease-standard);
    padding: var(--space-5);
    overflow-y: auto;
  }
  :host([open]) .panel {
    inset-inline-end: 0;
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-block-end: var(--space-3);
  }
  .close-btn {
    appearance: none;
    border: 1px solid var(--color-border);
    background: none;
    color: var(--color-text-muted);
    border-radius: var(--radius-md);
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  .close-btn:hover {
    color: var(--color-text);
    border-color: var(--color-primary);
  }
  .title {
    font-size: var(--fs-100);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-text-muted);
  }
  ol {
    list-style: none;
    margin: 0;
    padding: 0;
    border-inline-start: 2px solid var(--color-border);
    display: flex;
    flex-direction: column;
  }
  a {
    display: block;
    padding: var(--space-2) var(--space-4);
    margin-inline-start: -2px;
    border-inline-start: 2px solid transparent;
    color: var(--color-text-muted);
    text-decoration: none;
    font-size: var(--fs-200);
    line-height: var(--lh-normal);
    transition: color var(--duration-fast) var(--ease-standard),
      border-color var(--duration-fast) var(--ease-standard);
  }
  a:hover {
    color: var(--color-text);
  }
  a[aria-current='true'] {
    color: var(--color-primary);
    border-inline-start-color: var(--color-primary);
    font-weight: 600;
  }
  li[data-level='3'] a {
    padding-inline-start: var(--space-6);
    font-size: var(--fs-100);
  }
`;

function slugify(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * <page-toc target="#lesson-body" levels="2,3"></page-toc>
 * Builds a scroll-spy table of contents from the headings inside `target`
 * (defaults to levels h2/h3). Assigns an id to any heading missing one.
 *
 * Entirely self-contained off-canvas drawer (Priority 3): hidden by default,
 * opened only via its own edge tab, closes automatically the moment a
 * section link is picked — the lesson content never loses width to a
 * permanently-docked contents column.
 */
class PageToc extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <button class="tab" id="tab" type="button">${icon('list')}<span id="tab-label"></span></button>
      <div class="panel">
        <div class="head">
          <p class="title" id="title"></p>
          <button class="close-btn" id="close-btn" type="button">${icon('close')}</button>
        </div>
        <nav><ol></ol></nav>
      </div>
    `;
    this._list = this.shadowRoot.querySelector('ol');
    this._titleEl = this.shadowRoot.getElementById('title');
    this._tabLabelEl = this.shadowRoot.getElementById('tab-label');
    this._tabBtn = this.shadowRoot.getElementById('tab');
    this._closeBtn = this.shadowRoot.getElementById('close-btn');

    this._tabBtn.addEventListener('click', () => this.open());
    this._closeBtn.addEventListener('click', () => this.close());

    this._backdrop = document.createElement('div');
    this._backdrop.setAttribute('aria-hidden', 'true');
    Object.assign(this._backdrop.style, {
      position: 'fixed',
      inset: '0',
      background: 'rgba(6, 11, 18, 0.4)',
      opacity: '0',
      pointerEvents: 'none',
      transition: 'opacity 220ms ease',
      zIndex: 'var(--z-overlay)',
    });
    this._backdrop.addEventListener('click', () => this.close());
    document.body.appendChild(this._backdrop);

    this._onKeydown = (event) => {
      if (event.key === 'Escape' && this.hasAttribute('open')) this.close();
    };
    document.addEventListener('keydown', this._onKeydown);

    this._build();
    this._updateTitle();
    this._onLangChange = () => this._updateTitle();
    document.addEventListener('langchange', this._onLangChange);
  }

  disconnectedCallback() {
    document.removeEventListener('langchange', this._onLangChange);
    document.removeEventListener('keydown', this._onKeydown);
    this._backdrop.remove();
    this._observer?.disconnect();
  }

  open() {
    this.setAttribute('open', '');
    this._backdrop.style.opacity = '1';
    this._backdrop.style.pointerEvents = 'auto';
  }

  close() {
    this.removeAttribute('open');
    this._backdrop.style.opacity = '0';
    this._backdrop.style.pointerEvents = 'none';
  }

  toggle() {
    if (this.hasAttribute('open')) this.close();
    else this.open();
  }

  _updateTitle() {
    this._titleEl.textContent = t('toc.title');
    this._tabLabelEl.textContent = t('toc.title');
    this._tabBtn.setAttribute('aria-label', t('toc.title'));
    this._closeBtn.setAttribute('aria-label', t('action.close'));
  }

  _build() {
    const targetSelector = this.getAttribute('target');
    const target = targetSelector ? document.querySelector(targetSelector) : document;
    if (!target) return;

    const levels = (this.getAttribute('levels') ?? '2,3').split(',').map((n) => n.trim());
    const selector = levels.map((l) => `h${l}`).join(',');
    const headings = Array.from(target.querySelectorAll(selector));
    if (!headings.length) return;

    this._list.innerHTML = '';
    headings.forEach((heading) => {
      if (!heading.id) heading.id = slugify(heading.textContent) || `section-${Math.random().toString(36).slice(2, 8)}`;

      const li = document.createElement('li');
      li.dataset.level = heading.tagName.slice(1);
      const a = document.createElement('a');
      a.href = `#${heading.id}`;
      a.textContent = heading.textContent;
      a.dataset.targetId = heading.id;
      a.addEventListener('click', () => this.close());
      li.appendChild(a);
      this._list.appendChild(li);
    });

    this._observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (!visible.length) return;
        const topMost = visible.reduce((a, b) => (a.intersectionRatio > b.intersectionRatio ? a : b));
        this._setActive(topMost.target.id);
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: [0, 0.5, 1] }
    );
    headings.forEach((h) => this._observer.observe(h));
  }

  _setActive(id) {
    this._list.querySelectorAll('a').forEach((a) => {
      a.setAttribute('aria-current', String(a.dataset.targetId === id));
    });
  }
}

defineOnce('page-toc', PageToc);
