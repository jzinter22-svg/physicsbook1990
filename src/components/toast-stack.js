import { defineOnce, css } from './utils.js';
import { icon } from './icons.js';

const VARIANTS = {
  info: { icon: 'info', color: 'var(--color-info)', bg: 'var(--color-info-soft)' },
  success: { icon: 'checkCircle', color: 'var(--color-success)', bg: 'var(--color-success-soft)' },
  warning: { icon: 'alertTriangle', color: 'var(--color-warning)', bg: 'var(--color-warning-soft)' },
  danger: { icon: 'xCircle', color: 'var(--color-danger)', bg: 'var(--color-danger-soft)' },
};

const style = css`
  /* Shadow DOM doesn't inherit the light-DOM box-sizing reset from base.css. */
  *, *::before, *::after { box-sizing: border-box; }
  :host {
    position: fixed;
    inset-block-end: var(--space-5);
    inset-inline-end: var(--space-5);
    z-index: var(--z-toast);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    width: min(360px, calc(100vw - var(--space-8)));
    pointer-events: none;
  }
  .toast {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-4);
    border-radius: var(--radius-md);
    background: var(--glass-bg-strong);
    border: 1px solid var(--glass-border);
    box-shadow: var(--glass-shadow);
    backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
    -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
    pointer-events: auto;
    animation: slide-in var(--duration-normal) var(--ease-standard);
    animation-play-state: var(--anim-play, running);
  }
  @keyframes slide-in {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .icon-badge {
    flex: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: var(--bg);
    color: var(--color);
  }
  .message {
    flex: 1;
    font-size: var(--fs-300);
    color: var(--color-text);
    line-height: var(--lh-normal);
    padding-block-start: 3px;
  }
`;

/**
 * <toast-stack></toast-stack> — mount exactly once per page. Everything else
 * talks to it via showToast() in src/lib/toast.js, never direct references.
 */
class ToastStack extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `<style>${style}</style>`;
    this.setAttribute('aria-live', 'polite');
    this.setAttribute('role', 'status');

    this._onShowToast = (event) => this._push(event.detail);
    document.addEventListener('show-toast', this._onShowToast);
  }

  disconnectedCallback() {
    document.removeEventListener('show-toast', this._onShowToast);
  }

  _push({ message, variant, duration }) {
    const config = VARIANTS[variant] ?? VARIANTS.info;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <span class="icon-badge" style="--bg:${config.bg}; --color:${config.color}">${icon(config.icon)}</span>
      <span class="message"></span>
    `;
    toast.querySelector('.message').textContent = message;
    this.shadowRoot.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 200ms ease';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 200);
    }, duration);
  }
}

defineOnce('toast-stack', ToastStack);
