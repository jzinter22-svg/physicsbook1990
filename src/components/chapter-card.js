import { defineOnce, css } from './utils.js';
import { icon } from './icons.js';
import { t } from '../lib/i18n.js';

const style = css`
  /* Shadow DOM doesn't inherit the light-DOM box-sizing reset from base.css. */
  *, *::before, *::after { box-sizing: border-box; }
  :host {
    display: block;
    --accent: var(--card-accent, var(--color-text-muted));
  }
  .card {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding: var(--space-5);
    border-radius: var(--radius-xl);
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    box-shadow: var(--glass-shadow);
    backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
    -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
    overflow: hidden;
    transition: transform var(--duration-glass) var(--ease-standard),
      box-shadow var(--duration-glass) var(--ease-standard),
      border-color var(--duration-glass) var(--ease-standard);
  }
  .card::before {
    content: '';
    position: absolute;
    inset-inline: 0;
    top: 0;
    height: 4px;
    background: var(--accent);
  }
  /* Domain-color ring stays the primary hover cue (CVD-validated categorical
     accent — do not replace it); the cyan/violet glow layers behind it as a
     supplementary ambient halo so hover states still read as "Aurora glass". */
  :host(:hover) .card,
  :host(:focus-within) .card {
    transform: translateY(-4px);
    border-color: var(--accent);
    box-shadow: var(--glass-shadow), var(--glow-hover), 0 0 0 1px var(--accent);
  }
  .icon-badge {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-md);
    display: grid;
    place-items: center;
    background: var(--accent);
    color: var(--color-white);
    font-size: 1.3rem;
  }
  h3 {
    margin: 0;
    font-size: var(--fs-500);
  }
  p {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--fs-300);
    line-height: var(--lh-normal);
    flex: 1;
  }
  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--fs-100);
    font-weight: 700;
    padding: 3px var(--space-3);
    border-radius: var(--radius-pill);
    background: var(--color-accent-soft);
    color: var(--color-accent);
  }
  .badge--start {
    background: var(--color-primary-soft);
    color: var(--color-primary);
  }
  .badge svg {
    width: 0.9em;
    height: 0.9em;
  }
  .progress-text {
    font-size: var(--fs-200);
    color: var(--color-text-muted);
    font-weight: 600;
  }
  a.card-link {
    text-decoration: none;
    color: inherit;
    display: block;
    height: 100%;
  }
`;

/**
 * <chapter-card domain="mechanics" icon="compass" title-key="chapters.mechanics.title"
 *               desc-key="chapters.mechanics.desc" locked></chapter-card>
 * With no `domain`, renders as a neutral (non-categorical) card — used for the
 * "more chapters soon" tile so it never competes with the validated domain palette.
 * Omit `locked` and set `href` to make the whole card a real link to the chapter.
 */
class ChapterCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this._render();
    this._onLangChange = () => this._render();
    document.addEventListener('langchange', this._onLangChange);
  }

  disconnectedCallback() {
    document.removeEventListener('langchange', this._onLangChange);
  }

  _render() {
    const domain = this.getAttribute('domain');
    const iconName = this.getAttribute('icon') ?? 'beaker';
    const titleKey = this.getAttribute('title-key');
    const descKey = this.getAttribute('desc-key');
    const locked = this.hasAttribute('locked');
    const href = this.getAttribute('href');
    const accent = domain ? `var(--color-domain-${domain})` : 'var(--color-text-muted)';

    const cardInner = `
      <div class="card" style="--card-accent:${accent}">
        <div class="icon-badge">${icon(iconName)}</div>
        <h3>${t(titleKey)}</h3>
        <p>${t(descKey)}</p>
        <div class="footer">
          ${
            locked
              ? `<span class="badge">${icon('lock')}${t('nav.chapters.soon')}</span>`
              : `<span class="badge badge--start">${icon('play')}${t('chapters.start')}</span>`
          }
          <span class="progress-text">0%</span>
        </div>
      </div>
    `;

    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      ${!locked && href ? `<a class="card-link" href="${href}">${cardInner}</a>` : cardInner}
    `;
  }
}

defineOnce('chapter-card', ChapterCard);
