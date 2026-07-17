/*
  MathJax v3 loader.

  We load MathJax from a CDN at runtime (not bundled) so the ~2 MB TeX/SVG
  engine only downloads when a page actually contains math, and stays cached
  across chapters. `typesetMath()` is the one function chapter content and
  simulations should call after injecting new equation markup.
*/

const MATHJAX_SRC = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';

let loadPromise = null;

function configureMathJax() {
  window.MathJax = {
    tex: {
      inlineMath: [['\\(', '\\)'], ['$', '$']],
      displayMath: [['\\[', '\\]'], ['$$', '$$']],
      tags: 'ams',
    },
    chtml: {
      // Keep formulas left-to-right even when the surrounding page is RTL Arabic.
      displayAlign: 'center',
    },
    options: {
      // Skip typesetting inside code blocks and anything explicitly opted out.
      skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
      ignoreHtmlClass: 'no-mathjax',
    },
    startup: {
      typeset: false, // we trigger typesetting explicitly once components are ready
    },
  };
}

/** Loads the MathJax v3 engine exactly once, returning the same promise on repeat calls. */
export function loadMathJax() {
  if (loadPromise) return loadPromise;

  configureMathJax();

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = MATHJAX_SRC;
    script.async = true;
    script.onload = () => {
      window.MathJax.startup.promise.then(resolve).catch(reject);
    };
    script.onerror = () => reject(new Error('Failed to load MathJax from CDN'));
    document.head.appendChild(script);
  });

  return loadPromise;
}

/**
 * Re-typesets the given elements (or the whole document if omitted).
 * Safe to call repeatedly, e.g. after a simulation updates an equation's text.
 * @param {HTMLElement[]} [elements]
 */
export async function typesetMath(elements) {
  await loadMathJax();
  return window.MathJax.typesetPromise(elements);
}
