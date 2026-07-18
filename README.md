# كتاب الطبيعيات التفاعلي — Interactive Physics Book

An interactive, Arabic-first physics textbook: a design system, full RTL
support, MathJax equation rendering, a framework for interactive
simulations, and — as of Chapter 1 — real chapter content. See
[`ARCHITECTURE.md`](./ARCHITECTURE.md) for how the pieces fit together
before extending it.

## Getting started

```bash
npm install
npm run dev       # dev server at http://localhost:5173
npm run build     # production build to dist/
npm run preview   # preview the production build
```

## What's here

- Vite + vanilla JS + native Web Components (no framework dependency).
- A calm, minimal design system: generous whitespace, soft card shadows, a
  CVD-validated categorical palette for chapter domains (`src/styles/tokens.css`).
  All navigation (Home, Chapters, Search, Theme, Language) lives in one
  collapsible sidebar, off-canvas at every breakpoint — nothing else is
  permanently docked on screen.
- A single-focus home page: one hero (title, one line, one CTA) and the
  chapter grid — no competing panels.
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

- A reusable **physics simulation engine** (`src/engine/`): a `Vector2` class,
  a fixed-timestep `SimulationEngine` (physics stepping decoupled from
  render rate — stable at any display refresh rate), `CanvasEngine` /
  `SvgEngine` (world-coordinate, Y-up drawing with circle/line/arrow/grid/text
  primitives), a live-updating `GraphEngine`, framework-free drag/zoom/tooltip
  interaction behaviors (mouse + touch + keyboard), and pure-function formula
  libraries for motion, rotation, force, energy, momentum, waves,
  electricity, and chemistry — plus matching reusable UI controls
  (`<sim-slider>`, `<sim-play-toggle>`, `<sim-reset-button>`,
  `<sim-speed-control>`, `<sim-zoom-control>`, `<sim-value-display>`,
  `<sim-formula-display>`, `<unit-label>`). No chapter/lesson content — just
  the engine future chapters will build on.

- **Chapter 1 — الحركة الدائرية والدورانية (Circular & Rotational Motion)**
  at `/chapter-1.html`: every section from 1-1 (تمهيد) through 9-1 (أسئلة
  ومسائل الفصل), transcribed in full from the source textbook — circular
  motion and centripetal force/acceleration, satellite orbits and Kepler's
  three laws, rotational kinematics and moment of inertia, rotational
  energy/work/power, and angular momentum. Every worked example and every
  end-of-chapter question/problem is solved in full, one card per question
  with no skipped steps. Three interactive, directly draggable simulations
  (uniform circular motion, Kepler orbits sweeping equal areas, conservation
  of angular momentum) replace six of the book's static figures, each with a
  live-updating formula readout; the rest of the book's diagrams are
  hand-drawn SVGs. Supplementary asides ("did you know?", "remember") are
  collapsed by default so the lesson's core flow stays the one thing in
  focus. Unlocked and linked from the home page's chapter grid.

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the reasoning behind each
piece, including several Shadow DOM / CSS cascade gotchas worth knowing
before extending it.

## Reference material

`assets/pdf/كتاب الطبيعيات.pdf` is the source physics textbook — the sole
curriculum source for every chapter. (`assets/pdf/physics-book.pdf` is an
empty placeholder, not a real source.)
