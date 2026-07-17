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
- Interactive Science Lab design system: glassmorphism, soft glow, a
  CVD-validated categorical palette for chapter domains (`src/styles/tokens.css`).
- A dashboard-style home page: sticky top nav, responsive sidebar (off-canvas
  on mobile), hero section with an animated SVG illustration + floating
  particles, chapter-card grid, progress section, command-palette search, and
  a settings drawer.
- Arabic (default, RTL) / English (LTR) language toggle.
- Light/dark theme toggle, plus a reduced-motion override.
- MathJax v3, lazy-loaded, with a `<math-block>` component.
- Reusable UI components: `<app-header>`, `<app-sidebar>`, `<app-footer>`,
  `<app-search>`, `<settings-panel>`, `<ui-card>`, `<ui-tabs>`,
  `<lab-callout>`, `<chapter-card>`, `<progress-ring>`, `<stat-tile>`,
  `<sim-container>`.
- A base `Simulation` class (`src/lib/simulation.js`) for future canvas-based
  interactive physics simulations, plus a non-physics tech demo (not mounted
  on the home page) proving the render/resize/controls pipeline works.
- A full component **design system** at `/design-system.html` (own Vite
  entry, not linked from the home page): 12 content-card types (lesson,
  example, exercise, formula, note, warning, experiment, simulation, quiz,
  summary, mind map, glossary), navigation primitives (breadcrumb, table of
  contents, prev/next pager), UI primitives (buttons, inputs, tabs,
  accordion, modal, dialog, tooltip, toast, progress bar/ring), and physics
  component templates (SVG figure lightbox, decorative canvas animation,
  data chart, data table) — every one reusable, responsive, and RTL, with
  generic placeholder content only.

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the reasoning behind each
piece, including several Shadow DOM / CSS cascade gotchas worth knowing
before extending it.

## Reference material

`assets/pdf/` holds the source physics textbook PDFs (Arabic and generic
filenames) used as content reference for future chapter authoring.
