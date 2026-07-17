# كتاب الطبيعيات التفاعلي — Interactive Physics Book

Project foundation for an interactive, Arabic-first physics textbook: a
design system, full RTL support, MathJax equation rendering, and a framework
for interactive simulations. **No chapter content yet** — see
[`ARCHITECTURE.md`](./ARCHITECTURE.md) for how the pieces fit together
before adding any.

## Getting started

```bash
npm install
npm run dev       # dev server at http://localhost:5173
npm run build     # production build to dist/
npm run preview   # preview the production build
```

## What's here

- Vite + vanilla JS + native Web Components (no framework dependency).
- Interactive Science Lab design system (`src/styles/tokens.css`).
- Arabic (default, RTL) / English (LTR) language toggle.
- Light/dark theme toggle.
- MathJax v3, lazy-loaded, with a `<math-block>` component.
- Reusable UI components: `<app-header>`, `<app-nav>`, `<app-footer>`,
  `<ui-card>`, `<ui-tabs>`, `<lab-callout>`, `<sim-container>`.
- A base `Simulation` class (`src/lib/simulation.js`) for future canvas-based
  interactive physics simulations, plus a non-physics tech demo proving the
  render/resize/controls pipeline works end to end.

## Reference material

`assets/pdf/` holds the source physics textbook PDFs (Arabic and generic
filenames) used as content reference for future chapter authoring.
