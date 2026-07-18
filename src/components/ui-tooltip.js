import { defineOnce } from './utils.js';

let uid = 0;

/**
 * <ui-tooltip label="نص توضيحي">
 *   <button>؟</button>
 * </ui-tooltip>
 *
 * No shadow root, same reasoning as <form-field>: aria-describedby has to
 * resolve to an id in the same tree as the trigger element, so the tooltip
 * bubble is a plain light-DOM sibling instead of shadow-root content.
 * Visibility is pure CSS (:hover / :focus-within) — see .ui-tooltip* rules
 * in src/styles/base.css.
 */
class UiTooltip extends HTMLElement {
  static get observedAttributes() {
    return ['label'];
  }

  connectedCallback() {
    this.classList.add('ui-tooltip');
    this.setAttribute('tabindex', this.getAttribute('tabindex') ?? '-1');
    this._render();
  }

  attributeChangedCallback() {
    if (this.isConnected) this._render();
  }

  _render() {
    const trigger = this.firstElementChild;
    let bubble = this.querySelector('.ui-tooltip-bubble');

    if (!bubble) {
      bubble = document.createElement('span');
      bubble.className = 'ui-tooltip-bubble';
      bubble.id = `tooltip-${++uid}`;
      bubble.setAttribute('role', 'tooltip');
      this.appendChild(bubble);
      trigger?.setAttribute('aria-describedby', bubble.id);
    }

    bubble.textContent = this.getAttribute('label') ?? '';
  }
}

defineOnce('ui-tooltip', UiTooltip);
