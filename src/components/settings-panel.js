import { defineOnce, css } from './utils.js';
import { icon } from './icons.js';
import { t } from '../lib/i18n.js';
import { getStoredMotion, setMotion } from '../lib/motion.js';

const style = css`
  /* Shadow DOM doesn't inherit the light-DOM box-sizing reset from base.css. */
  *, *::before, *::after { box-sizing: border-box; }
  :host {
    display: block;
  }
  /*
    Same drawer pattern as <app-sidebar>/<page-toc>: physically anchored to
    the left edge (not a logical inset-inline-* property, and not a
    display:none/block toggle — a real left transition is what makes this
    actually slide instead of just fading in at a fixed position), a light
    backdrop instead of a dark fullscreen one, and rounded corners only on
    the content-facing (right) edge.
  */
  .panel {
    position: fixed;
    inset-block: 0;
    left: -340px;
    width: min(320px, 88vw);
    z-index: var(--z-modal);
    background: var(--glass-bg-strong);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    border-right: 1px solid var(--glass-border);
    border-top-right-radius: var(--radius-lg);
    border-bottom-right-radius: var(--radius-lg);
    box-shadow: var(--shadow-float);
    display: flex;
    flex-direction: column;
    transition: left var(--duration-normal) var(--ease-standard);
  }
  :host([open]) .panel {
    left: 0;
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-5);
    border-block-end: 1px solid var(--color-border);
  }
  .head h2 {
    margin: 0;
    font-size: var(--fs-500);
  }
  .close-btn {
    appearance: none;
    border: 1px solid var(--color-border);
    background: none;
    border-radius: var(--radius-pill);
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    cursor: pointer;
    color: var(--color-text-muted);
    transition: color var(--duration-fast) var(--ease-standard),
      border-color var(--duration-fast) var(--ease-standard),
      transform var(--duration-fast) var(--ease-standard);
  }
  .close-btn:hover {
    color: var(--color-text);
    border-color: var(--color-primary);
    transform: scale(1.06);
  }
  .body {
    padding: var(--space-5);
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    overflow-y: auto;
  }
  .field label.field-label {
    display: block;
    font-weight: 700;
    font-size: var(--fs-200);
    color: var(--color-text-muted);
    margin-block-end: var(--space-3);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .segmented {
    display: flex;
    background: var(--color-bg-sunken);
    border-radius: var(--radius-md);
    padding: 4px;
    gap: 4px;
  }
  .segmented button {
    flex: 1;
    appearance: none;
    border: none;
    background: none;
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-sm);
    font: inherit;
    font-weight: 600;
    font-size: var(--fs-200);
    color: var(--color-text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
  }
  .segmented button[aria-pressed='true'] {
    background: var(--color-bg-raised);
    color: var(--color-primary);
    box-shadow: var(--shadow-sm);
  }
  .segmented svg {
    width: 1em;
    height: 1em;
  }
`;

const MOTION_OPTIONS = [
  { value: 'full', key: 'settings.motion.full' },
  { value: 'reduced', key: 'settings.motion.reduced' },
];

class SettingsPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <div class="panel" role="dialog" aria-modal="true">
        <div class="head">
          <h2 data-i18n="settings.title"></h2>
          <button class="close-btn" id="close-btn" type="button">${icon('close')}</button>
        </div>
        <div class="body">
          <div class="field">
            <label class="field-label" data-i18n="settings.motion.label"></label>
            <div class="segmented" id="motion-group"></div>
          </div>
        </div>
      </div>
    `;

    this._motionGroup = this.shadowRoot.getElementById('motion-group');
    this.shadowRoot.getElementById('close-btn').addEventListener('click', () => this.close());

    // A light scrim, not a fullscreen dark overlay — same fix as
    // <app-sidebar>/<page-toc>'s backdrops, and for the same reason: a real
    // light-DOM element (not a shadow-root child) is what lets it sit above
    // the rest of the page reliably.
    this._backdrop = document.createElement('div');
    this._backdrop.setAttribute('aria-hidden', 'true');
    Object.assign(this._backdrop.style, {
      position: 'fixed',
      inset: '0',
      background: 'rgba(15, 23, 42, 0.1)',
      backdropFilter: 'blur(1px)',
      WebkitBackdropFilter: 'blur(1px)',
      opacity: '0',
      pointerEvents: 'none',
      transition: 'opacity 220ms ease',
      zIndex: 'var(--z-overlay)',
    });
    this._backdrop.addEventListener('click', () => this.close());
    document.body.appendChild(this._backdrop);

    this._onOpenRequest = () => this.open();
    this._onKeydown = (event) => {
      if (event.key === 'Escape' && this.hasAttribute('open')) this.close();
    };
    document.addEventListener('open-settings', this._onOpenRequest);
    document.addEventListener('keydown', this._onKeydown);

    this._render();
    this._onLangChange = () => this._render();
    this._onMotionChange = () => this._render();
    document.addEventListener('langchange', this._onLangChange);
    document.addEventListener('motionchange', this._onMotionChange);
  }

  disconnectedCallback() {
    document.removeEventListener('open-settings', this._onOpenRequest);
    document.removeEventListener('keydown', this._onKeydown);
    document.removeEventListener('langchange', this._onLangChange);
    document.removeEventListener('motionchange', this._onMotionChange);
    this._backdrop.remove();
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

  _render() {
    this.shadowRoot.querySelector('[data-i18n="settings.title"]').textContent = t('settings.title');
    this.shadowRoot.querySelector('[data-i18n="settings.motion.label"]').textContent = t('settings.motion.label');
    this.shadowRoot.getElementById('close-btn').setAttribute('aria-label', t('settings.close'));

    const motion = getStoredMotion();
    this._motionGroup.innerHTML = MOTION_OPTIONS.map(
      (opt) => `<button type="button" data-value="${opt.value}" aria-pressed="${opt.value === motion}">${t(opt.key)}</button>`
    ).join('');
    this._motionGroup.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => setMotion(btn.dataset.value));
    });
  }
}

defineOnce('settings-panel', SettingsPanel);
