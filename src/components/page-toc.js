import { defineOnce, css } from './utils.js';
import { t } from '../lib/i18n.js';

const style = css`
  /* Shadow DOM doesn't inherit the light-DOM box-sizing reset from base.css. */
  *, *::before, *::after { box-sizing: border-box; }
  :host {
    display: block;
  }
  .title {
    font-size: var(--fs-100);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-text-muted);
    margin-block-end: var(--space-3);
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
 */
class PageToc extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `<style>${style}</style><p class="title"></p><nav><ol></ol></nav>`;
    this._list = this.shadowRoot.querySelector('ol');
    this._titleEl = this.shadowRoot.querySelector('.title');

    this._build();
    this._updateTitle();
    this._onLangChange = () => this._updateTitle();
    document.addEventListener('langchange', this._onLangChange);
  }

  disconnectedCallback() {
    document.removeEventListener('langchange', this._onLangChange);
    this._observer?.disconnect();
  }

  _updateTitle() {
    this._titleEl.textContent = t('toc.title');
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
