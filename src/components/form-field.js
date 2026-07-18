import { defineOnce } from './utils.js';

let uid = 0;

/**
 * <form-field label="..." help-text="..." error-text="">
 *   <input class="input" type="text">
 * </form-field>
 *
 * Deliberately has NO shadow root: a <label for="..."> can't reliably
 * associate with an <input> living in a different shadow tree (id lookups
 * and ARIA references don't cross shadow boundaries), so this component
 * enhances its own light-DOM children directly instead.
 */
class FormField extends HTMLElement {
  static get observedAttributes() {
    return ['label', 'help-text', 'error-text'];
  }

  connectedCallback() {
    this.classList.add('field');
    this._render();
  }

  attributeChangedCallback() {
    if (this.isConnected) this._render();
  }

  _render() {
    const control = this.querySelector('input, textarea, select');
    if (!control) return;
    if (!control.id) control.id = `field-${++uid}`;

    let label = this.querySelector(':scope > label.field-label');
    const labelText = this.getAttribute('label');
    if (labelText) {
      if (!label) {
        label = document.createElement('label');
        label.className = 'field-label';
        this.insertBefore(label, control);
      }
      label.htmlFor = control.id;
      label.textContent = labelText;
    } else {
      label?.remove();
    }

    let help = this.querySelector(':scope > .field-help');
    const errorText = this.getAttribute('error-text');
    const helpText = this.getAttribute('help-text');
    const text = errorText || helpText;

    if (text) {
      if (!help) {
        help = document.createElement('p');
        help.className = 'field-help';
        help.id = `${control.id}-help`;
        this.appendChild(help);
      }
      help.textContent = text;
      help.dataset.error = String(Boolean(errorText));
      control.setAttribute('aria-describedby', help.id);
      control.setAttribute('aria-invalid', String(Boolean(errorText)));
    } else {
      help?.remove();
      control.removeAttribute('aria-describedby');
      control.removeAttribute('aria-invalid');
    }
  }
}

defineOnce('form-field', FormField);
