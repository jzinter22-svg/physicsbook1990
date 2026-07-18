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
index.html                 Entry HTML / the home page
src/
  main.js                  App bootstrap: theme, i18n, motion, chapter grid, progress stats
  styles/
    tokens.css             Design tokens (color, type, spacing, motion, shape, glass, glow)
    base.css                Reset + base typography + buttons + reduced-motion wiring
    layout.css              Dashboard shell (topbar+sidebar+content) + responsive grid
    rtl.css                  The few things CSS logical properties can't express
  lib/
    theme.js                 Light/dark theme, persisted + system-aware
    i18n.js                   ar/en strings, drives <html lang/dir>
    motion.js                  Reduced-motion override, drives --anim-play token
    mathjax.js                MathJax v3 loader + typesetMath()
    simulation.js              Base class for canvas-driven simulations
    demo-simulation.js          Tech-demo subclass (NOT chapter content, not mounted)
    progress.js                 localStorage-backed chapter-completion stats
  locales/
    ar.js, en.js               UI string dictionaries (plain JS modules, not .json — see below)
  data/
    chapters.js                 Placeholder chapter catalogue (category names only)
  components/
    icons.js                    Shared inline-SVG icon set
    app-header.js                Sticky top nav: sidebar toggle, search, theme/lang/settings
    app-sidebar.js                Off-canvas (mobile) / sticky (desktop) primary nav
    app-footer.js
    app-search.js                 Command-palette style chapter search overlay
    settings-panel.js             Theme/language/motion drawer
    ui-card.js, ui-tabs.js, lab-callout.js
    chapter-card.js                Locked/coming-soon chapter tile
    progress-ring.js, stat-tile.js  Single-value meter / KPI tile (see Progress UI below)
    particle-field.js, hero-visual.js  Decorative hero SVG + floating particles
    math-block.js                Wraps TeX/MathML, auto-typesets on mutation
    sim-container.js             Chrome (viewport + start/pause/reset) for a Simulation
    utils.js                      defineOnce() + no-op css/html tag helpers
    index.js                     Registers every component

    -- Design system (Phase 3) --
    content-card.js               ContentCard base + 12 registered variants (see below)
    breadcrumb-nav.js, page-toc.js, pager-nav.js   Navigation primitives
    form-field.js, ui-tooltip.js    No-shadow-root components (see "Light-DOM exceptions")
    ui-accordion.js                <ui-accordion> + <ui-accordion-item>
    ui-modal.js, ui-dialog.js       General overlay / confirm-style overlay
    progress-bar.js                Linear sibling of <progress-ring>
    toast-stack.js                 Singleton toast host — see src/lib/toast.js
    svg-figure.js, canvas-figure.js  Figure frames (click-to-enlarge / decorative canvas loop)
    data-chart.js, data-table.js    Chart + table templates — no bundled data

    -- Physics engine controls (Phase 4) --
    unit-label.js                  Formats "m/s^2" -> "m/s²", "kg*m/s" -> "kg·m/s"
    sim-value-display.js            Live label + number + unit readout
    sim-formula-display.js           <math-block> with live {placeholder} substitution
    sim-slider.js                    Self-labeled, unit-aware range input
    sim-play-toggle.js, sim-reset-button.js, sim-speed-control.js, sim-zoom-control.js
                                      Standalone controls — talk to any engine via events
  lib/
    toast.js                      showToast() — fires a "show-toast" document event
  engine/                        Physics simulation engine (Phase 4) — see its own section below
    vector.js, animation-engine.js, simulation-engine.js
    canvas-engine.js, svg-engine.js, graph-engine.js
    units.js
    interactions/  drag.js, zoom.js, tooltip-follow.js
    physics/       motion.js, rotation.js, force.js, energy.js, momentum.js,
                    waves.js, electricity.js, chemistry.js
design-system.html            Component-library showcase (own Vite entry, see below)
src/design-system.js          Its bootstrap: same init as main.js + demo wiring
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
- Any UI string goes in `src/locales/ar.js` / `en.js`, not inline in
  markup. Light-DOM text uses `data-i18n="key"` and is re-rendered by
  `applyLang()` in `i18n.js`. **Components with a Shadow DOM
  cannot rely on
  `data-i18n`** (the global scanner can't reach across the shadow boundary) —
  they import `t()` directly and re-render on the `langchange` event (see
  `app-header.js`, `app-sidebar.js`, `lab-callout.js` for the pattern).

## Shadow DOM gotchas (read before adding a component)

Every component in `src/components/` renders into a Shadow DOM. Two easy-to-miss
consequences, both discovered and fixed while building the home page:

1. **The light-DOM `box-sizing: border-box` reset in `base.css` does not reach
   into shadow roots.** Without repeating it, elements default to the UA
   stylesheet's `content-box`, which silently adds padding on top of any
   `width`/`height` you set (this broke `app-sidebar`'s height calculation).
   Every component's `css` template therefore opens with its own
   `*, *::before, *::after { box-sizing: border-box; }` — keep that line when
   copying a component as a starting point for a new one.
2. **CSS custom properties inherit across the shadow boundary; selector rules
   do not.** Use custom properties (like `--anim-play`, see Motion below) to
   reach into a shadow tree from `base.css`; don't assume an outer rule like
   `:root[data-motion='reduced'] *` will touch anything inside a component's
   own `<style>`.

A third, non-shadow-specific gotcha that cost real debugging time: **a bare
`1fr` grid track (or an implicit `auto` track) has an automatic minimum sized
to its content**, so a long heading or an unwrapped row can force a grid
container — and everything up the ancestor chain — wider than the viewport.
Every `fr` track in this codebase is written `minmax(0, 1fr)`, and grid/flex
items that shouldn't propagate their content size upward get an explicit
`min-width: 0` (see `.app-shell`, `.hero`, `.grid`, `.stat-row` in
`layout.css`). `body` also carries `overflow-x: hidden` as a last line of
defense, since the off-canvas sidebar's closed (off-screen) position still
extends the document's scrollable width otherwise.

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
- **Domain accents** (`--color-domain-*`) tag chapters by physics topic —
  mechanics, thermo, waves, electromagnetism. This exact 4-hue set and order
  is CVD-validated (colorblind-safe on both the adjacent *and* all-pairs
  pairlist, light and dark) via the dataviz skill's `validate_palette.js`;
  don't reorder, recolor, or add a 5th hue without re-running it — a 5th
  topic should fold into "Other" (see the home page's neutral "more chapters
  soon" tile) rather than take a straight 5th color. Every domain-colored
  element also carries an icon + text label — identity is never color-alone.
- Light and dark themes are both first-class (`data-theme="dark"` on
  `<html>`, toggled by `src/lib/theme.js`, defaulting to system preference).
- **Glassmorphism tokens** (`--glass-bg`, `--glass-border`, `--glass-blur`,
  `--glass-shadow`) and **soft-glow gradients** (`--glow-primary`,
  `--glow-accent`) each have light/dark variants — use the `.glass` utility
  class or reference the tokens directly, never hard-code an rgba blur.
- Typography: Tajawal for Arabic, Inter for Latin text, JetBrains Mono for
  numeric readouts (progress ring / stat tile values).
- A subtle graph-paper grid pattern (`.lab-texture`) and ambient glow blobs
  (`.glow-field`) frame the hero section — used sparingly, not everywhere.

## Responsive layout

Mobile-first. Shared breakpoints: `640 / 768 / 1024 / 1280`px, used
consistently across `layout.css` and components (don't invent new
breakpoints ad hoc). The home page is a dashboard shell: a sticky topbar
(`app-header`, full width) above a sidebar + content two-column grid at
`>=1024px`, collapsing to a single column with an off-canvas sidebar drawer
below that. `.sim-frame` gives simulation containers a stable, resizable
aspect-ratio box on any viewport.

### Sidebar stacking note

`app-sidebar` creates its own mobile backdrop as a `<div>` appended straight
to `document.body` (not inside its shadow root), so the drawer can sit above
dimmed page content while everything else stays untouched. Because that
backdrop is appended after the sidebar in DOM order, it would otherwise win
equal-z-index paint order and render over the drawer — the sidebar's mobile
`:host` rule uses `z-index: var(--z-modal)` (above `--z-overlay`) specifically
to stay on top regardless of DOM position. If you add another top-level
overlay that manages its own backdrop this way, give it the same treatment.

## Motion & reduced motion

`src/lib/motion.js` tracks a `reduced | full` preference (persisted +
system-aware, same pattern as `theme.js`), applied as `data-motion` on
`<html>`. `base.css` zeroes out animation/transition durations for light-DOM
elements when reduced; shadow-DOM components with their own `@keyframes`
(`particle-field.js`, `hero-visual.js`) reference
`animation-play-state: var(--anim-play, running)` instead, since that custom
property — unlike a selector rule — correctly inherits into shadow roots.
Any new looping CSS animation inside a component must do the same.

## Search & Settings

Both are overlay components toggled via plain `document` `CustomEvent`s
(`open-search`, `open-settings`, `toggle-sidebar`) rather than direct method
calls, so any button anywhere (topbar, sidebar) can trigger them without an
import/reference to the overlay element itself.

- `<app-search>` is a command-palette-style dialog (`/` shortcut) filtering
  `src/data/chapters.js` client-side. Every result is locked/"coming soon" —
  it's a real, working search over the site's placeholder structure, not a
  mock.
- `<settings-panel>` is a slide-in drawer exposing the same theme/language
  controls as the topbar plus the motion-reduction toggle, as segmented
  controls bound to `theme.js` / `i18n.js` / `motion.js`.

## Progress UI

`src/lib/progress.js` stores completed chapter IDs in `localStorage` and
exposes `computeStats(chapters)`. Nothing can be marked complete yet (no
chapter content exists), so the home page's progress ring and stat tiles
always show `0` / `0%` today — the storage shape and API are ready for a
future chapter page to call `markComplete(id)`. `<progress-ring>` is a
single-ratio meter (per the dataviz skill's form heuristic: "a single ratio
against a limit → meter, same-ramp track") — its track and fill are both
drawn from the `--color-primary` ramp, never two competing hues.

## Simulation framework

`Simulation` (`src/lib/simulation.js`) is the base class every future
interactive simulation extends: it owns canvas creation, DPR-aware resizing
via `ResizeObserver`, and a `requestAnimationFrame` loop with clamped delta
time. Subclasses only implement `update(dt)` and `render(ctx)`.

`<sim-container>` is the reusable UI chrome around a `Simulation` (viewport +
start/pause/reset controls). `DemoSimulation` (`src/lib/demo-simulation.js`)
is a **tech-demo-only** oscilloscope sweep that proved the render loop,
resize handling, and controls during foundation testing — it is not mounted
on the home page and is not physics content; keep it as a reference for the
`Simulation` subclassing pattern, or delete it once a real chapter
simulation exists.

## Design system (Phase 3)

`design-system.html` is a second, independent Vite entry point (see
`vite.config.js`'s `build.rollupOptions.input`) — a component-library
showcase, reachable at `/design-system.html`, not linked from the home page.
It demonstrates every component below with generic placeholder copy
(`card.placeholder.title/body`, "Category A/B/C", etc.) — deliberately no
Chapter 1 content. Its own sidebar is a live `<page-toc>` built from the
page's own headings, doubling as that component's demo.

### Content cards

`content-card.js` exports one `ContentCard` base class and registers 12 tag
names against it — `lesson-card`, `example-card`, `exercise-card`,
`formula-card`, `note-card`, `warning-card`, `experiment-card`,
`simulation-card`, `quiz-card`, `summary-card`, `mindmap-card`,
`glossary-card`. Each just sets `static config = { icon, accent, labelKey }`;
adding a 13th type is three lines, not a new file. Shared attributes:
`title`, `number` (e.g. `1.2`, shown as "Lesson · 1.2"), `collapsible` (+
`collapsed` to start closed). Accent colors are deliberately reused from the
existing semantic tokens (primary/success/warning/info/accent/muted) rather
than inventing 12 new hues — these are UI-type indicators always paired with
an icon + label, not a categorical data series, so the dataviz skill's
palette-cap concerns don't apply the way they do to the chapter-domain
colors.

### Light-DOM exceptions

Two components deliberately have **no shadow root**: `form-field.js` and
`ui-tooltip.js`. A `<label for="…">` or `aria-describedby` reference can't
reliably resolve across a shadow boundary (id lookups are scoped per tree),
so both enhance their own light-DOM children directly instead of rendering
into an encapsulated tree. If a future component needs a real `for`/id or
ARIA relationship pointing at slotted/light-DOM content, follow this
pattern rather than fighting the shadow boundary.

### Overlays

`ui-modal` (general-purpose, e.g. viewing a figure full-size) and `ui-dialog`
(confirm/cancel) both follow the `app-search`/`settings-panel` shape: the
backdrop lives *inside* the component's own shadow root as a sibling of the
dialog box, not appended to `document.body` separately — that avoids the
stacking-order trap described above for `app-sidebar`. Open with
`el.open()`/`el.close()` (method calls, not a global event) since a page can
have more than one modal/dialog instance.

### Physics component templates

`svg-figure` (click-to-enlarge lightbox around a slotted `<svg>`),
`canvas-figure` (the decorative, non-interactive sibling of `sim-container` —
mounts a `Simulation` and auto-starts unless reduced motion is on),
`data-chart` (single-series bar chart; ships with **no data** — set
`el.data = [{label, value}, …]` from calling code; sequential single-hue
bars per the dataviz form heuristic, plus a toggle to an equivalent
`<table>`), and `data-table` (a responsive/sticky-header frame around a real
slotted `<table>`, so colspans and multi-row headers just work natively).
None of these contain sample physics data — `design-system.html` feeds them
generic placeholders at runtime.

### Three more bugs found building this phase (fixed, worth knowing)

1. **`.grid--2-up` was redeclared inside the `≥1024px` media block in
   `layout.css`, after `.grid--3-up`.** Min-width media queries stack (both
   apply at 1440px), so the redeclaration silently won the cascade tie and
   capped every `class="grid grid--2-up grid--3-up"` grid at 2 columns even
   on wide viewports — present (unnoticed) since Phase 2's chapter-card grid.
   Fixed by deleting the redundant redeclaration; `.grid--3-up` alone in that
   block is sufficient since the 640px rule already carries forward.
2. **A plain class selector that sets `display` beats the `hidden` attribute
   at equal specificity**, because author-origin rules always outrank the
   UA stylesheet regardless of selector order. `content-card.js`'s
   `.toggle-btn { display: grid; … }` meant the collapse-toggle button
   rendered on *every* card, not just `collapsible` ones, even though it
   had the `hidden` attribute. Fix: add a same-file `.toggle-btn[hidden] {
   display: none; }` rule wherever a component sets `display` on something
   it also toggles via `.hidden`.
3. **`:empty` never matches a shadow-root wrapper around a named `<slot>`**,
   because the `<slot>` element itself always counts as a child node,
   whether or not anything is actually assigned to it. `content-card.js` and
   `ui-modal.js` both had a `.footer:empty { display: none; }` rule meant to
   hide an unused footer slot — it never fired, so an empty footer bar
   showed on every card/modal. Fixed by listening for the slot's
   `slotchange` event and toggling a real `hidden` property based on
   `slot.assignedNodes({ flatten: true }).length`.

(Also re-confirmed, not new: literal backticks inside a `/* CSS comment */`
that itself lives inside a `` css`…` `` JS template literal still close the
outer template early, exactly like the Phase 2 `app-sidebar.js` incident —
it recurred twice while writing this phase's components. When writing a
comment inside any component's `css` template, don't use backticks; say
"the hidden attribute" instead of `` `hidden` ``.)

## Physics engine (Phase 4)

`src/engine/` is the reusable simulation engine every future chapter's
interactive figures build on. Nothing in it renders a page or knows about
any specific physics lesson — it's imported by chapter code, not visited
directly.

### Vector2 (`vector.js`)

The one truly foundational piece — position, velocity, force, and momentum
are all 2D vectors. Instance methods **mutate `this` and return it** for
chaining (`velocity.addScaled(acceleration, dt)`), matching the convention
of real-time physics/game libraries (three.js `Vector2`, Box2D's `b2Vec2`)
rather than allocating a new object per operation — a simulation stepping
hundreds of vectors at 60 FPS can't afford that garbage-collector pressure.
Reach for `.clone()` or the static helpers (`Vector2.add(a, b)`) when
immutability is more convenient than raw speed.

### Clock & SimulationEngine (`animation-engine.js`, `simulation-engine.js`)

`SimulationEngine` runs physics on a **fixed timestep decoupled from the
render rate** (the classic "fix your timestep" pattern): however many
display frames actually happen between two ticks, `step(dt)` is always
called with the same `fixedDt`, accumulated via a `while` loop, while
`render(alpha)` is called once per displayed frame with `alpha` (0–1)
indicating how far into the next physics step the accumulator sits — so
rendering can optionally interpolate between the last two physics states
instead of visibly stepping. This is what keeps integration numerically
stable and reproducible regardless of whether the display is 60 Hz, 120 Hz,
or a throttled background tab, instead of the naive "multiply by whatever
dt this frame happened to be" approach (which is what the *legacy* Phase 1
`Simulation` class in `src/lib/simulation.js` still does — kept as-is for
backward compatibility with `sim-container`/`canvas-figure`, but
`SimulationEngine` is the one to reach for going forward). Exposes the same
`start()`/`pause()`/`reset()`/`running`/`destroy()` shape as the legacy
class by convention, but is not a drop-in replacement (different `step`/
`render` signatures) — adapting `sim-container` to accept either is future
work, not done in this phase.

### CanvasEngine & SvgEngine (`canvas-engine.js`, `svg-engine.js`)

Both wrap a physics-friendly coordinate system — world units, **Y-up**
(matching math/physics convention, unlike the DOM's Y-down), a configurable
origin (`'center' | 'bottom-left' | 'top-left'`) and `pixelsPerUnit` scale —
with `toScreen`/`toWorld`/`clientToWorld` conversions and a small shared set
of draw primitives (circle, line, **arrow** — the standard way to draw a
force/velocity vector, grid, text). CanvasEngine is immediate-mode (redraw
every frame from scratch); SvgEngine is retained-mode (create each shape
once, then `updateCircle`/`updateLine`/etc. its attributes per frame) —
cheaper for a diagram with a handful of stable shapes, where canvas is
cheaper for a scene that's fundamentally "clear and repaint everything."
Pick whichever fits the simulation; both share the same coordinate API so
switching later doesn't change the physics/layout code.

**Bug found and fixed here**: `ResizeObserver` is spec-guaranteed to fire
once asynchronously right after `observe()` even when nothing actually
changed size — and assigning `canvas.width`/`height`, even to their current
value, implicitly clears the canvas bitmap. Since CanvasEngine is
immediate-mode with no retained scene to redraw from, that spurious initial
callback was silently wiping out anything drawn synchronously right after
construction (a one-shot render, e.g. a static figure). Fixed by skipping
the width/height reassignment — and the resulting wipe — when the target
pixel size hasn't actually changed. (The legacy `Simulation` class and
`GraphEngine` were never affected: both unconditionally re-render from
retained state on every resize, including the spurious one, so they
self-heal by design rather than needing this guard.)

### GraphEngine (`graph-engine.js`)

A live line plot for any physics quantity over time (or against another
quantity) — domain-agnostic, just numbers in and a trace out.
`addPoint(x, y)` pushes into a rolling buffer (`maxPoints`) and re-renders;
axes auto-scale to the visible data unless `yMin`/`yMax` are fixed. Per the
dataviz skill's form heuristic this is a single-series line (no legend
needed — the direct-labeled current-value dot at the trace's end substitutes
for one), sequential in spirit (magnitude over time), with recessive
gridlines and an emphasized zero-line when the range crosses it.

### Interactions (`interactions/`)

Framework-free behaviors attachable to a canvas, an SVG shape, or any
element, all via the Pointer Events API (one code path for mouse, touch,
and pen):

- **`attachDrag`** — pointer drag with an optional `hitTest` (for canvas,
  where there's no per-shape DOM node to attach to) and arrow-key nudging
  when the target is focusable, since a canvas has no native keyboard
  equivalent for "drag this" otherwise.
- **`attachZoom`** — mouse wheel *and* two-finger pinch (tracked via
  multiple active pointers) funneled through one `onZoom(factor, center)`
  callback, so callers don't handle desktop and mobile separately.
- **`attachFollowTooltip`** — a pointer-following floating tooltip (reusing
  the `.ui-tooltip-bubble` styling from `base.css`) for canvas content,
  which has no DOM element per shape for `<ui-tooltip>` to anchor to.

`<sim-zoom-control>`'s +/−/reset buttons are the keyboard/screen-reader-
reachable equivalent of wheel/pinch zoom — pair both so zoom is never
mouse/touch-only.

### Physics formula modules (`physics/`)

One small module per domain — **motion, rotation, force, energy, momentum,
waves, electricity, chemistry** — each a set of pure functions implementing
standard formulas (`kineticEnergy(mass, speed)`, `elasticCollision1D(...)`,
`pendulumPeriod(length, g)`, `ohmsLawCurrent(voltage, resistance)`, the
ideal gas law, and so on). These are reference formula libraries, not
lessons: no narrative, no worked examples, no exercises — a future chapter
imports the functions it needs and supplies its own explanation and
context. `units.js` (`formatQuantity`, `formatUnit`) formats the numbers
these produce consistently with the rest of the UI.

### Verifying the engine

There's no committed demo/showcase page for this phase (unlike Phase 3's
`design-system.html`) — deliberately, since a live physics demo risks
crossing into "lesson content." It was instead verified with a throwaway
local HTML harness (built, exercised, screenshotted, then deleted — not
committed) confirming: correct vector math and coordinate round-trips;
correct results from a representative formula in every physics module;
`SimulationEngine` rendering at the display's ~60 FPS while stepping physics
at its own configured fixed rate independently; drag/zoom/tooltip attaching
without error under touch/mobile emulation; and full RTL/i18n reactivity
(theme/language toggles) plus keyboard accessibility (`aria-pressed`,
`aria-label`) on every new control.

## Chapter 1 — Circular & Rotational Motion (Phase 5)

Chapter 1 is a hand-written page (`chapter-1.html` + `src/chapter-1.js`),
not a content pipeline from the source PDF — with one chapter shipped, it
was too early to know what a general chapter-authoring pipeline should look
like (see the "not here yet" note below, carried over from Phase 4). The
page is a new Vite entry (`chapter1` in `vite.config.js`'s
`rollupOptions.input`), reachable from the home page once a chapter's
`CHAPTERS` entry (`src/data/chapters.js`) has `locked: false` and an `href`
— `<chapter-card>` and `main.js`'s `renderChapterGrid()` were extended to
render an unlocked card as a real link instead of always forcing the
`locked` attribute.

**Source discipline**: every fact, figure, table, example, and exercise
in the chapter traces back to `assets/pdf/كتاب الطبيعيات.pdf` (pages 5–20),
transcribed by rendering each page to an image (the PDF's Arabic text is
garbled at the glyph level through `pdftotext`, but renders correctly as an
image) and cross-checked against `pdftotext -layout` output for any
ambiguous passage. Nothing in the chapter body is invented content — the
"did you know" boxes, real-life applications, and "think" prompts are all
lifted from the textbook's own asides, not authored fresh, so "textbook as
the only curriculum source" holds even for the enrichment material.

**Content structure**: each subsection is a `<lesson-card>` (exposition) with
inline `<formula-card>`s for numbered equations, `<svg-figure>`s for the
textbook's static diagrams, and `<lab-callout variant="note" label="…">`
for "هل تعلم؟" / "تذكر" / "فكر" boxes (the custom `label` override on
`lab-callout` exists for exactly this — a callout whose heading isn't one
of the three built-in variant labels). Every worked example is one
`example-card` with the full step-by-step derivation in the body (each
algebraic step its own `<math-block>`, per "no skipped steps") and the
final boxed result in the card's `footer` slot; every chapter-end exercise
follows the same one-card-one-question-one-complete-solution rule via
`exercise-card` (numerical problems, "explain why" items) or `quiz-card`
(multiple-choice, since the reveal — correct option plus its reasoning —
still ships in the same card's `footer`, just visually set apart, never
hidden). Chapter content is authored directly in Arabic (the textbook's
only language) rather than run through `t()`; only the surrounding UI
chrome (card type labels, breadcrumb, simulation control labels) stays
bilingual through the existing `ar.json`/`en.json` dictionaries, so the
language toggle still repaints the whole page without throwing — it just
leaves the lesson prose in Arabic either way, same as a real bilingual
textbook site would.

### Interactive simulations (`src/simulations/`)

Three chapter-specific simulations replace six of the textbook's static
vector/orbit diagrams outright (rather than duplicating both a static image
*and* an interactive version of the same figure) — each is a thin
composition of `CanvasEngine` + `SimulationEngine` from the Phase 4 engine,
built the same way any future chapter's simulations should be:

- **`CircularMotionSim`** — uniform circular motion with live tangential
  velocity (green, solid) and centripetal acceleration (red, dashed)
  vectors, replacing Figures 1-1/2-1/3-1. Vectors are distinguished by
  line style and a text label in addition to color (never color-alone).
  Reuses `centripetalAcceleration`/`centripetalForce` from
  `engine/physics/rotation.js` rather than re-deriving them.
- **`KeplerOrbitSim`** — replaces Figures 4-1/5-1/6-1. A body orbits a
  fixed focus on a true polar ellipse (`r(θ) = a(1-e²)/(1+e·cosθ)`) with
  `dθ/dt = k/r²` for a constant `k` — the standard angular-momentum-
  conservation result that makes the body numerically (not just visually)
  sweep equal areas in equal times. A trailing shaded sector, built by
  sampling the orbit path between the current angle and the angle at
  `now - lag` (a small ring-buffer of `{time, unwrapped angle}` samples,
  interpolated), makes Kepler's second law directly visible rather than
  asserted.
- **`AngularMomentumSim`** — a two-point-mass "spinning body" whose arm
  radius is slider-controlled; angular momentum `L` is fixed at the last
  reset, so `ω = L / I(r)` (via `momentOfInertia.pointMass` and
  `angularMomentum` from `engine/physics/rotation.js`) rises automatically
  as the arms are pulled in — the same mechanism as the textbook's diving
  exercise (9-1, "explain why" #4) and the flywheel "did you know", made
  interactive instead of only described.

Each simulation exposes the same `running`/`start()`/`pause()`/`reset()`/
`destroy()` shape as `SimulationEngine` (so `<sim-container>`'s existing
play/pause/reset chrome drives it with no adapter code) plus an `onUpdate`
callback that `src/chapter-1.js` wires to `<sim-value-display>` elements,
and public setters (`setRadius`, `setOmega`, …) that `<sim-slider>`'s
`sim-change` event calls directly — no new event-wiring pattern beyond what
`design-system.html` already demonstrated for the Phase 3/4 components.

### Verifying Chapter 1

Checked with a throwaway Playwright harness against `vite preview`
(same pattern as Phase 4, not committed): production build succeeds; all
three simulations mount their canvas and free-run without a console error;
slider input propagates to the physics and back out to the value displays
with correct numbers (spot-checked against the formulas by hand); the
language toggle flips `dir`/`lang` and every bilingual control's label with
no error; and no new *visible* horizontal scroll on a 375px viewport (wide
`<data-table>`s scroll within their own frame, which is by design — the
`documentElement.scrollWidth` metric itself is not a reliable check on this
codebase, since the off-canvas `<app-sidebar>`'s transform inflates it
identically on the pre-existing home page). MathJax itself couldn't be
verified rendering in this sandboxed environment (no route to the CDN) —
`<math-block>`'s existing error handling was confirmed to fail gracefully
rather than break the page.

## Deploying to GitHub Pages

This project ships to GitHub Pages as raw source with **no build step** —
Pages is configured to "deploy from a branch" (root folder), serving
`index.html`/`chapter-1.html`/`design-system.html` and `src/**` exactly as
committed. That works because nothing in the codebase needs bundling (no
bare npm-package imports in browser-loaded code, every import is a relative
path) — but it also means two classes of bug only show up under this
hosting mode, not in local dev (`vite`) or a local production build
(`vite preview`), both of which mask them:

- **Root-absolute paths break under a project-page subpath.** A GitHub
  Pages *project* site (as opposed to a `<user>.github.io` *user* site) is
  served at `https://<user>.github.io/<repo>/`, not at the domain root. Any
  `href`/`src` written as `/src/...` or `/chapter-1.html` resolves against
  the domain root (`https://<user>.github.io/src/...` — a 404) instead of
  the actual page. The Vite dev server masks this entirely (it *is* the
  domain root at `localhost:5173/`), so every entry HTML file's `<link>`/
  `<script>` tags, and every internal nav link (breadcrumb, pager, the
  chapter-card `href` in `src/data/chapters.js`), had to be relative
  (`src/styles/tokens.css`, `index.html#chapters`, `chapter-1.html`) instead
  of root-absolute. Since all three HTML entry points live at the repo
  root, plain relative paths (no leading `/`) resolve correctly both in dev
  and under any Pages subpath — no environment-specific base-path logic
  needed.
- **A bare `.json` ES module import fails outright with no bundler.**
  `src/lib/i18n.js` used to `import ar from '../locales/ar.json'`. Vite
  transparently supports that in dev and in a production build, but a
  browser loading raw, unbundled ES modules requires an explicit import
  attribute (`with { type: 'json' }`) for a JSON module — without it, the
  request still succeeds (200, correct `application/json` content type)
  but the module loader itself rejects it: *"Failed to load module
  script... Strict MIME type checking is enforced for module scripts"*.
  Because ES module graphs fail atomically, that one bad import took down
  all of `i18n.js` and therefore every module that imports it — `main.js`
  and `chapter-1.js` both never finished loading, which is why the home
  page rendered as a fully blank white page (its content is entirely
  JS-rendered custom elements) while `chapter-1.html` still showed its
  static Arabic prose but with every interactive piece (simulations,
  language/theme toggles) silently dead. Fixed by converting
  `src/locales/ar.json`/`en.json` into `src/locales/ar.js`/`en.js` — plain
  `export default { ... }` modules holding the identical dictionaries — so
  the import is just a normal, unassisted ES module import with no
  bundler-only or browser-version-dependent behavior involved.

Lesson for anything added later: verify a from-scratch deploy by serving
the raw repo tree with a plain static file server *rooted one directory
above the repo* (so entry files sit behind a `/physicsbook1990/`-style
subpath, matching a Pages project site), not by trusting `vite`/
`vite preview` alone — both hide exactly the two bug classes above.

## Calm-UI rebuild (Phase 6)

A full visual/UX pass across every page, driven by an explicit brief: reduce
cognitive load (especially for weaker students) by cutting decoration,
simplifying navigation, and making interaction/feedback louder where it
actually teaches something. No textbook content changed — this phase only
touched chrome, layout, and the simulation UI.

**Tokens** (`tokens.css`): `--shadow-card`/`--shadow-card-hover` replace the
sharper `--shadow-sm`/`--shadow-md` on persistent cards (header/modal
shadows keep the originals — they're transient chrome, not part of the
calm reading surface); `--radius-lg` 20px → 24px; `--content-max-width:
68ch` caps prose measure; `--layout-gutter`/section spacing scaled up a
step for more breathing room.

**Navigation** (Priority 2 of the brief): `<app-header>` is now just a menu
button + brand mark — search, theme, and language all moved into
`<app-sidebar>`, which is a collapsible off-canvas drawer **on every
breakpoint**, not just mobile (`layout.css`'s old `@media (min-width:
1024px)` static sidebar column was removed entirely; `app-sidebar.js`'s
fixed/off-canvas positioning is unconditional now). The sidebar holds
exactly five things — Home, Chapters, Search, Theme, Language — with
everything else (currently just the reduced-motion preference) one tap
further behind a "More settings" link into a trimmed-down
`<settings-panel>`.

**Home page**: `<hero-visual>`/`<particle-field>` (orbiting-electron SVG +
glow blobs + floating particles) are deleted outright, along with the
`.glass`/`.glow-field`/`.lab-texture` utility classes in `layout.css` that
only they used — decorative motion with no teaching content, and Priority 1
was explicit about removing anything non-essential. The progress-ring/
stat-tile section is gone too (it was never wired to real completion
tracking — `markComplete()` has no caller anywhere — so it was permanently
static filler competing with the one section that matters, the chapter
grid). What's left: one centered hero (title, one line, one primary CTA)
and the chapter grid, capped at 2-up instead of 3-up for more room per card.

**Cards** (Priority 5): `content-card.js` (all 12 variants),
`chapter-card.js`, `stat-tile.js`, and `lab-callout.js` all moved off
`--glass-bg`/backdrop-blur onto a solid `--color-bg-raised` surface with
`--shadow-card`, bumped internal padding a step, and enlarged every
touch-sized element (icon badges, collapse toggles) to 44px. `lab-callout`
gained a `collapsible`/`collapsed` pair of attributes, reusing the same
data-attribute toggle pattern as `ContentCard`.

**Chapter 1 progressive disclosure** (Priority 6): the required lesson
skeleton (title → objectives → visualization → explanation → examples →
exercises → summary) is untouched, but every supplementary aside — "did you
know?", "remember" — now renders `collapsible collapsed`, so the default
view is the core teaching flow with asides one tap away rather than N
extra always-open panels stacked in the reading path. "Think" prompts stay
open (they're meant to be seen immediately, before the worked solution) and
worked-example/exercise solutions stay fully visible in their one card, per
the earlier one-card-one-question-one-complete-solution rule — progressive
disclosure applies to enrichment asides, not to the graded content itself.
The chapter's own hero also lost its two-column "chapter contents" list
(redundant with the sticky `<page-toc>`) and its glass/pattern-grid
background in favor of the same solid card treatment as everywhere else;
the objectives list moved into a `<ui-accordion>` for the same reason.

**Simulations** (Priority 4): all three (`src/simulations/`) gained direct
pointer-drag manipulation via the existing `attachDrag` helper — grab the
orbiting particle in `CircularMotionSim` or `KeplerOrbitSim` and spin/
reposition it by hand (`hitTest` checks proximity in world space, `onDrag`
recomputes the angle from the pointer position, rotation pauses for the
gesture and resumes on release); grab either mass in `AngularMomentumSim`
and pull it in/out to change the arm radius directly (rotation pauses
during the drag too — it turned out to matter more than expected, see
below). Each sim also grew a throttled `<sim-formula-display>` showing the
governing equation with live substituted numbers (throttled to 5/s in
`chapter-1.js`, **not** the simulation's own render loop, which stays at
full frame rate — `sim-formula-display` re-typesets through MathJax on
every `.values` write, and MathJax is far too expensive to run 60×/second).

**Bug found verifying the angular-momentum drag**: initially only the
other two sims paused their own rotation while being dragged; this one
left the arm spinning on the theory that "watching it keep spinning while
you pull it in" was a better demonstration. In practice, at the higher
angular speeds this sim reaches at small radius, the fixed 0.35-world-unit
grab tolerance couldn't keep up with a fast-moving target between
`pointerdown` and the first `pointermove` — the same failure mode a real
student's slower reaction time would hit, not just a test-timing artifact.
Fixed by pausing rotation during the drag here too (consistent with the
other two sims) and widening the tolerance slightly to 0.4; the "watch it
speed up" payoff still happens, just on release rather than mid-grab.

Verified with the same raw-tree-under-a-subpath Playwright harness as
Phase 5: zero horizontal overflow at a 375px viewport on both pages, zero
console errors, sidebar contents match the five-item spec exactly, and —
critically — the three drag interactions were checked by reading each
sim's actual internal state (`theta`/`r`) before and after a pointer
sequence computed from that same state, not just by asserting the code
runs; the angular-momentum bug above was only caught because of that.

## What's deliberately not here yet

- No chapter-authoring pipeline from the source PDFs — Chapter 1 is
  hand-written; revisit once a second chapter makes the common shape clear.
- No test setup — added when there's non-trivial logic to test (physics
  simulation math, not UI chrome).
