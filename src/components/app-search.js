import { defineOnce, css } from './utils.js';
import { icon } from './icons.js';
import { t } from '../lib/i18n.js';
import { CHAPTERS } from '../data/chapters.js';

const style = css`
  /* Shadow DOM doesn't inherit the light-DOM box-sizing reset from base.css. */
  *, *::before, *::after { box-sizing: border-box; }
  :host {
    position: fixed;
    inset: 0;
    z-index: var(--z-modal);
    display: none;
    padding: 10vh var(--layout-gutter) var(--space-6);
  }
  :host([open]) {
    display: block;
  }
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(6, 11, 18, 0.55);
  }
  .dialog {
    position: relative;
    max-width: 560px;
    margin-inline: auto;
    background: var(--glass-bg-strong);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    overflow: hidden;
  }
  .input-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-4) var(--space-5);
    border-block-end: 1px solid var(--color-border);
  }
  .input-row svg {
    flex: none;
    width: 1.2em;
    height: 1.2em;
    color: var(--color-text-muted);
  }
  input {
    flex: 1;
    border: none;
    background: none;
    font-size: var(--fs-400);
    color: var(--color-text);
    outline: none;
  }
  input::placeholder {
    color: var(--color-text-muted);
  }
  .results {
    list-style: none;
    margin: 0;
    padding: var(--space-2);
    max-height: 50vh;
    overflow-y: auto;
  }
  .results li {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-3);
    border-radius: var(--radius-md);
    cursor: pointer;
  }
  .results li:hover,
  .results li[data-active='true'] {
    background: var(--color-bg-sunken);
  }
  .result-icon {
    flex: none;
    width: 36px;
    height: 36px;
    border-radius: var(--radius-md);
    display: grid;
    place-items: center;
    color: var(--color-white);
  }
  .result-text {
    flex: 1;
    min-width: 0;
  }
  .result-title {
    font-weight: 700;
    font-size: var(--fs-300);
  }
  .result-desc {
    font-size: var(--fs-200);
    color: var(--color-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .badge {
    flex: none;
    font-size: var(--fs-100);
    font-weight: 700;
    padding: 2px var(--space-2);
    border-radius: var(--radius-pill);
    background: var(--color-accent-soft);
    color: var(--color-accent);
  }
  .empty {
    padding: var(--space-6) var(--space-5);
    text-align: center;
    color: var(--color-text-muted);
    font-size: var(--fs-300);
  }
`;

class AppSearch extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._activeIndex = -1;
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <div class="backdrop"></div>
      <div class="dialog" role="dialog" aria-modal="true">
        <div class="input-row">
          ${icon('search')}
          <input type="text" autocomplete="off" spellcheck="false" />
        </div>
        <ul class="results"></ul>
      </div>
    `;

    this._input = this.shadowRoot.querySelector('input');
    this._results = this.shadowRoot.querySelector('.results');
    this._dialog = this.shadowRoot.querySelector('.dialog');

    this.shadowRoot.querySelector('.backdrop').addEventListener('click', () => this.close());
    this._input.addEventListener('input', () => this._filter());
    this._input.addEventListener('keydown', (event) => this._onKeydown(event));

    this._onOpenRequest = () => this.open();
    this._onGlobalKeydown = (event) => this._onGlobalKeydown_(event);
    document.addEventListener('open-search', this._onOpenRequest);
    document.addEventListener('keydown', this._onGlobalKeydown);

    this._updateStrings();
    this._onLangChange = () => {
      this._updateStrings();
      this._filter();
    };
    document.addEventListener('langchange', this._onLangChange);
  }

  disconnectedCallback() {
    document.removeEventListener('open-search', this._onOpenRequest);
    document.removeEventListener('keydown', this._onGlobalKeydown);
    document.removeEventListener('langchange', this._onLangChange);
  }

  _updateStrings() {
    this._input.placeholder = t('search.placeholder');
    this._dialog.setAttribute('aria-label', t('search.dialogLabel'));
  }

  _onGlobalKeydown_(event) {
    const isOpen = this.hasAttribute('open');
    const target = event.target;
    const isTyping = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;

    if (!isOpen && event.key === '/' && !isTyping) {
      event.preventDefault();
      this.open();
    } else if (isOpen && event.key === 'Escape') {
      this.close();
    }
  }

  open() {
    this.setAttribute('open', '');
    this._input.value = '';
    this._filter();
    requestAnimationFrame(() => this._input.focus());
  }

  close() {
    this.removeAttribute('open');
  }

  _onKeydown(event) {
    const items = Array.from(this._results.children);
    if (!items.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this._setActive(Math.min(this._activeIndex + 1, items.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this._setActive(Math.max(this._activeIndex - 1, 0));
    } else if (event.key === 'Enter' && this._activeIndex >= 0) {
      items[this._activeIndex]?.dispatchEvent(new Event('click'));
    }
  }

  _setActive(index) {
    const items = Array.from(this._results.children);
    items.forEach((item, i) => item.setAttribute('data-active', String(i === index)));
    items[index]?.scrollIntoView({ block: 'nearest' });
    this._activeIndex = index;
  }

  _filter() {
    const query = this._input.value.trim().toLowerCase();
    const matches = CHAPTERS.filter((chapter) => {
      const title = t(chapter.titleKey).toLowerCase();
      const desc = t(chapter.descKey).toLowerCase();
      return !query || title.includes(query) || desc.includes(query);
    });

    this._activeIndex = matches.length ? 0 : -1;

    if (!matches.length) {
      this._results.innerHTML = `<li class="empty" style="cursor:default">${t('search.empty')}</li>`;
      return;
    }

    this._results.innerHTML = matches
      .map(
        (chapter, i) => `
          <li data-active="${i === 0}" data-href="#chapter-${chapter.id}">
            <span class="result-icon" style="background:var(--color-domain-${chapter.domain})">${icon(chapter.icon)}</span>
            <span class="result-text">
              <div class="result-title">${t(chapter.titleKey)}</div>
              <div class="result-desc">${t(chapter.descKey)}</div>
            </span>
            <span class="badge">${t('nav.chapters.soon')}</span>
          </li>
        `
      )
      .join('');

    this._results.querySelectorAll('li[data-href]').forEach((item) => {
      item.addEventListener('click', () => {
        const href = item.getAttribute('data-href');
        this.close();
        document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
  }
}

defineOnce('app-search', AppSearch);
