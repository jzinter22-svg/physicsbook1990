# Architecture

Foundation for an interactive Arabic physics textbook. This document explains
the *why* behind the structure — read it before adding Chapter 1 content.

## Stack

- **Vite** — dev server + build, zero framework lock-in.
- **Vanilla JS + native Web Components** (Custom Elements + Shadow DOM) for
  reusable UI. No React/Vue: the content is book chapters (mostly static
  markup) plus canvas-based simulations, neither of which benefits from a
  component framework's reactivity model enough to justify the dependency.
- **Plain CSS with custom properties** as the design system — no
  preprocessor, no CSS-in-JS. Every visual value traces back to a token in
  `src/styles/tokens.css`.
- **MathJax v3**, loaded from a CDN at runtime (not bundled) so the engine
  only downloads on pages that actually contain math.

## Directory layout

```
index.html                 Entry HTML (also the homepage / foundation demo)
src/
  main.js                  App bootstrap: theme, i18n, component registration
  styles/
    tokens.css             Design tokens (color, type, spacing, motion, shape)
    base.css                Reset + base typography
    layout.css              Responsive grid/layout primitives
    rtl.css                  The few things CSS logical properties can't express
  lib/
    theme.js                 Light/dark theme, persisted + system-aware
    i18n.js                   ar/en strings, drives <html lang/dir>
    mathjax.js                MathJax v3 loader + typesetMath()
    simulation.js              Base class for canvas-driven simulations
    demo-simulation.js          Tech-demo subclass (NOT chapter content)
  locales/
    ar.json, en.json           UI string dictionaries
  components/
    app-header.js, app-nav.js, app-footer.js
    ui-card.js, ui-tabs.js, lab-callout.js
    math-block.js               Wraps TeX/MathML, auto-typesets on mutation
    sim-container.js             Chrome (viewport + start/pause/reset) for a Simulation
    index.js                     Registers every component
```

## Language & RTL

Arabic is the **primary, default language** (`<html lang="ar" dir="rtl">`),
matching the book's audience. English is a secondary UI toggle for anyone
maintaining the project.

Rules for future contributors:

- Use CSS **logical properties** everywhere (`margin-inline-start`,
  `inset-inline-end`, `text-align: start`) instead of physical ones
  (`margin-left`, `right`, `text-align: left`). This is what makes the layout
  mirror automatically when `dir` flips — `rtl.css` only needs to cover the
  handful of things logical properties can't express (icon mirroring,
  directional shadows, isolating embedded LTR fragments like formulas).
- Any UI string goes in `src/locales/ar.json` / `en.json`, not inline in
  markup. Light-DOM text uses `data-i18n="key"` and is re-rendered by
  `applyLang()` in `i18n.js`. **Components with a Shadow DOM cannot rely on
  `data-i18n`** (the global scanner can't reach across the shadow boundary) —
  they import `t()` directly and re-render on the `langchange` event
  (see `app-header.js`, `app-nav.js`, `lab-callout.js` for the pattern).

## MathJax

`src/lib/mathjax.js` configures and lazy-loads MathJax v3 from a CDN. Call
`typesetMath(elements?)` after injecting new equation markup; it's safe to
call repeatedly. The `<math-block>` component wraps this for static content
and re-typesets automatically via `MutationObserver` if its content changes
(e.g. a simulation updating a live formula) — note it must disconnect its
own observer while typesetting, since MathJax rewrites the block's children
and would otherwise retrigger itself.

MathJax output is forced `direction: ltr` even inside Arabic paragraphs
(`rtl.css`), since formula structure is inherently left-to-right.

## Design system

`src/styles/tokens.css` defines the "Interactive Science Lab" theme:

- **Brand color** — cyan/teal (`--color-primary`), evoking lab
  instrumentation, with amber as the energy/accent color.
- **Domain accents** (`--color-domain-*`) are reserved, unused tokens for
  tagging future chapters by physics topic (mechanics, thermo, waves,
  electromagnetism, optics) — wire these up when chapter navigation exists.
- Light and dark themes are both first-class (`data-theme="dark"` on
  `<html>`, toggled by `src/lib/theme.js`, defaulting to system preference).
- Typography: Tajawal for Arabic, Inter for Latin text, JetBrains Mono
  reserved for future code/data readouts.
- A subtle graph-paper grid pattern (`.lab-texture`) is available for
  "lab notebook" framing — used sparingly, not on every section.

## Responsive layout

Mobile-first. Shared breakpoints: `640 / 768 / 1024 / 1280`px, used
consistently across `layout.css` and components (don't invent new
breakpoints ad hoc). `.sim-frame` gives simulation containers a stable,
resizable aspect-ratio box on any viewport.

## Simulation framework

`Simulation` (`src/lib/simulation.js`) is the base class every future
interactive simulation extends: it owns canvas creation, DPR-aware resizing
via `ResizeObserver`, and a `requestAnimationFrame` loop with clamped delta
time. Subclasses only implement `update(dt)` and `render(ctx)`.

`<sim-container>` is the reusable UI chrome around a `Simulation` (viewport +
start/pause/reset controls). `DemoSimulation` on the homepage is a **tech
demo only** — an oscilloscope-style sweep proving the render loop, resize
handling, and controls work. It is explicitly not physics content and should
be removed or replaced once real chapter simulations exist.

## What's deliberately not here yet

- No chapter content or navigation — `nav.chapters` in the header links
  nowhere and is marked "coming soon" on purpose.
- No routing/build-per-chapter setup — decide this when Chapter 1 starts,
  since it depends on how many chapters and how they're authored (hand-written
  HTML vs. a content pipeline from the source PDFs in `assets/pdf/`).
- No test setup — added when there's non-trivial logic to test (physics
  simulation math, not UI chrome).
