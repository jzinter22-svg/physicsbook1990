import { defineOnce, css } from './utils.js';
import { typesetMath } from '../lib/mathjax.js';

const style = css`
  /* Shadow DOM doesn't inherit the light-DOM box-sizing reset from base.css. */
  *, *::before, *::after { box-sizing: border-box; }
  :host {
    display: block;
    overflow-x: auto;
  }
  ::slotted(*) {
    margin: 0;
  }
`;

/**
 * <math-block>\[ E = mc^2 \]</math-block>
 * Wraps TeX/MathML content and triggers MathJax typesetting once it's in the DOM,
 * and again whenever its content changes (e.g. a simulation updates the formula).
 */
class MathBlock extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `<style>${style}</style><slot></slot>`;
    this._typeset();

    // MathJax rewrites our own children into <mjx-container> markup, so the
    // observer must pause itself around _typeset() or it triggers on its own output.
    this._observer = new MutationObserver(() => this._typeset());
    this._observer.observe(this, { childList: true, characterData: true, subtree: true });
  }

  disconnectedCallback() {
    this._observer?.disconnect();
  }

  _typeset() {
    this._observer?.disconnect();
    typesetMath([this])
      .catch((error) => {
        console.error('MathJax typesetting failed:', error);
      })
      .finally(() => {
        this._observer?.observe(this, { childList: true, characterData: true, subtree: true });
      });
  }
}

defineOnce('math-block', MathBlock);
