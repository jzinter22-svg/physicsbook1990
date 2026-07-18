/** Registers a custom element only if the tag isn't already defined (safe under Vite HMR). */
export function defineOnce(tagName, ctor) {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, ctor);
  }
}

/** No-op tag functions — purely so editors can apply CSS/HTML syntax highlighting to template literals. */
export const css = (strings, ...values) => strings.reduce((acc, s, i) => acc + s + (values[i] ?? ''), '');
export const html = css;
