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

## Building a simulation for a new chapter

A firm rule going forward: **only build a simulation for a concept an
actual, written lesson needs.** Don't build ahead for topics (waves,
optics, fields, ...) that don't have chapter content yet — an
unreferenced simulation has no page to live on, no lesson context to be
correct *for*, and nothing to verify it against. What follows is the
pattern the three Chapter 1 simulations share, so the next chapter that
needs one doesn't have to invent the wiring from scratch.

**1. One class per concept, in `src/simulations/<name>-sim.js`.** Compose
it from existing engine pieces — don't reach for a new rendering
technology per simulation:

- `CanvasEngine` (`src/engine/canvas-engine.js`) for the world-coordinate,
  Y-up drawing surface. Pick `pixelsPerUnit` so the scene's natural size
  (an orbit radius, a spring's rest length) fills most of the frame.
- `SimulationEngine` (`src/engine/simulation-engine.js`) for the
  fixed-timestep physics loop. Store it as `this.sim`; every simulation
  class exposes the same `running` getter and `start()`/`pause()`/
  `reset()`/`destroy()` methods by simply delegating to `this.sim`'s
  methods of the same name — this is what lets `<sim-container>` drive
  any of them with zero per-simulation adapter code.
- The relevant pure-function formula module under `src/engine/physics/`
  (`rotation.js`, `motion.js`, `energy.js`, ...) for the actual physics —
  never re-derive a formula inline that already exists there.

**2. Expose tunable parameters as plain setter methods** (`setRadius`,
`setEccentricity`, ...) that mutate state and re-render. Pair each with a
`<sim-slider>` in the chapter HTML, wired in `src/chapter-<n>.js` via its
`sim-change` event — never bind a raw `<input type="range">` by hand.

**3. Make at least one part of the scene directly draggable** if the
concept has an obvious "thing to grab" (an orbiting body, a mass on a
spring, a projectile's launch point) — dragging teaches faster than a
slider alone. Use `attachDrag` (`src/engine/interactions/drag.js`) on
`this.engine.canvas`:
- `hitTest(event)`: convert `event.clientX/Y` via
  `this.engine.clientToWorld(...)` and check distance to the draggable
  point in world space (0.35–0.4 world units has worked well as a
  forgiving-but-not-sloppy grab tolerance).
- **Pause the relevant physics advance while `_dragging` is true** — every
  one of the three existing sims does this, and the angular-momentum one
  originally didn't; at higher speeds the target moved out from under the
  pointer between `pointerdown` and the first `pointermove`, which is a
  real usability failure, not just a test artifact (see the Phase 6
  postmortem above). Don't repeat that mistake in a new one.
- Resume normal motion on `onEnd`.

**4. Add a speed control** — `<sim-speed-control speeds="0.25,0.5,1,2">` —
and forward its `sim-speed-change` event to a `setSpeed(value)` method
that just does `this.sim.timeScale = value`. This is the same three lines
in every simulation class; there's no reason to skip it.

**5. Add a live formula readout** with `<sim-formula-display
template="...">` showing the governing equation with substituted numbers.
Set the `template` attribute **once**, at mount time, not on every
update — only write `.values` on each frame. Even that has to be
throttled in the mounting code (`src/chapter-<n>.js`), not inside the
simulation class itself, to roughly 5 updates/second:

```js
function throttled(fn, intervalMs) {
  let last = 0;
  return (...args) => {
    const now = performance.now();
    if (now - last < intervalMs) return;
    last = now;
    fn(...args);
  };
}
```

This exists because `<sim-formula-display>` re-typesets through MathJax on
every `.values` write, and MathJax is far too expensive to run once per
animation frame (~60/s) — throttling only the formula text, never the
canvas's own render loop, is what keeps the simulation itself at full
frame rate while the equation still reads as "live" to a student.

**6. Labels and measurements belong on the canvas, not just beside it.**
Draw the current value of the quantity the student is manipulating
directly next to the relevant line/point in the scene (e.g. "r = 1.5 m"
along a radius line) in addition to the `<sim-value-display>` readouts
below it — seeing the number attached to the thing it measures, right
where the thing is, is what makes the visualization teach rather than
decorate.

**7. Wire it all up in `src/chapter-<n>.js`, not inside the simulation
class.** The simulation class only knows physics and rendering; DOM
lookups, event wiring, and the throttled formula updates all live in the
chapter's own bootstrap script, mounted inside
`customElements.whenDefined('sim-container').then(...)`, exactly as
`chapter-1.js` does for its three sims.

## Phase 7 — fullscreen viewer, a fourth simulation, and a real Arabic-rendering bug

**Fullscreen image viewer rewrite (`svg-figure.js`).** The old lightbox
opened to a dark screen with only a close button visible — root-caused
with Playwright by reading computed styles: `.lightbox-content` (a flex
item with no explicit width) shrank to fit only its sized children, and
the cloned `<svg>` (viewBox only, no explicit `width`/`height`) computed to
`0×0` inside an unstyled wrapper, collapsing the whole content box to the
close button's own ~64×64px. **The fix**: give the stage a definite,
non-shrink-to-fit size (`width:min(85vw,1000px); height:min(78vh,800px)`)
and let the SVG fill it at `width:100%;height:100%` (default
`preserveAspectRatio="xMidYMid meet"` handles the letterboxing). Rebuilt on
top of that fix: zoom via toolbar buttons, mouse wheel, and two-finger
pinch (all funneled through the existing `attachZoom` helper), drag-to-pan
via `attachDrag`, ESC/backdrop-click/close-button, and an opacity
fade-in/out (double-`requestAnimationFrame` so the `display:none→block`
flip lands before the transition starts). A new `sim-target="#sim-id"`
attribute lets a figure skip the static image entirely: if the illustrated
concept already has a live simulation, the expand button scrolls to and
pulse-highlights that instead — "interactive version always wins over a
picture of the same thing," wired once on `<svg-figure>` and reused by any
future figure that duplicates a simulation's concept (see the circular
motion example in `chapter-1.html`, whose "car on a curve" figure now
points at `#sim-circular` instead of opening a redundant static drawing).

**Fourth simulation: rotational motion & torque
(`rotational-motion-sim.js`).** Fills the one real gap in section 5-1
(τ = Iα, moment of inertia, angular kinematics) that had no dedicated
visualization — a solid disk driven by a tangential force at its rim.
`τ = torqueFromForce(F, r)`, `I = momentOfInertia.solidDisk(m, r)`,
`α = τ/I`, integrated the same way circular motion's ω already was. Follows
the 7-point pattern above exactly (drag the rim marker to spin the disk by
hand, pausing integration and zeroing ω for the gesture; speed control;
throttled formula readout; on-canvas `r = ... m` label; wiring lives in
`chapter-1.js`, not the sim class). Verified the integration is physically
correct (not just "doesn't crash") by comparing Δω across two different
force values over the same wall-clock interval and confirming the ratio
matches the force ratio exactly (2.0), rather than trusting an absolute
real-time comparison — headless Playwright's `requestAnimationFrame`
throttling makes absolute-time comparisons unreliable, but the *relative*
scaling between two runs is not affected by that.

**Kepler sim: velocity + gravity vectors, central-body spin.** The orbiting
body's true velocity vector is now drawn from the analytic derivative of
`r(theta)` (radial component `vr = e·sinθ·r²/L·θ̇` plus tangential
`vθ = r·θ̇`, composed into Cartesian) — tangent to the actual elliptical
path, not merely "perpendicular to r" (those only coincide at
perihelion/aphelion). A second vector always points from the body toward
the focus, representing the gravitational acceleration that produces this
exact orbit (a true inverse-square central force always pulls toward the
focus, even off the semi-axes). The focus itself now spins on an
independent `_earthSpin` accumulator (advances every step regardless of
whether the student is mid-drag) standing in for the planet's own axial
rotation — three separate rotations sharing one canvas without being
conflated.

**A real Arabic-rendering bug, not just a hypothetical one.**
`<math-block>` shows MathJax-typeset output, but if MathJax fails to load
(this project has no offline fallback — see `src/lib/mathjax.js`) the raw
`\[ ... \]` TeX source sits as plain text inside an RTL paragraph and gets
reordered by the browser's bidi algorithm into unreadable garbage — e.g.
`(363.4)^{2} = 363.4 \times 363.4 = 132{,}059.56` rendered as
`\ times 363.4 = 132{,}059.56\ 363.4 = {2}^(363.4) ]\`. This is exactly
what a blocked/slow CDN (school networks, some countries, offline-first
use) would do to *every equation on every page* — found by deliberately
testing in this sandbox, where the MathJax CDN is unreachable, which
turned out to be a free natural test case for a bug that would otherwise
only show up in degraded-network conditions. Fixed with one rule in
`rtl.css`: `[dir='rtl'] math-block { direction: ltr; unicode-bidi: isolate;
text-align: start; }` — mirrors the existing `mjx-container` rule but
applies *before* typesetting succeeds (or forever, if it never does),
matching the project's convention of targeting the actual light-DOM
element directly rather than relying on shadow-DOM style inheritance.

**Page table-of-contents: off-canvas, not permanent (`page-toc.js`).** The
per-lesson TOC (`<page-toc>`) used to render as a sticky column that
permanently took ~260px of width from the lesson on desktop — exactly the
"table of contents still permanently visible" pattern Priority 3 called
out as wrong, just on a different element than the already-fixed
`<app-sidebar>`. `page-toc.js` is now fully self-contained: a small fixed
edge tab (`writing-mode: vertical-rl`, always visible, minimal footprint)
opens a sliding panel from the *inline-end* edge — the opposite side from
`<app-sidebar>`'s inline-start drawer, so the two never collide — with the
same backdrop/ESC/auto-close-on-link-click behavior as the main sidebar.
`.ds-layout` (`layout.css`) dropped its two-column grid entirely; the
lesson content is `display:block`, full width, at every breakpoint now.
The wrapping `<aside class="ds-toc">` in `chapter-1.html`/
`design-system.html` was removed since the component now positions itself.

## Phase 8 — Aurora UI visual language (pure UI/UX, zero content changes)

A visual-only redesign: no lesson, explanation, example, exercise, formula,
or simulation *logic* changed — only how the same content is presented.

**Tokens (`tokens.css`)**: `--gradient-primary`/`--gradient-primary-hover`
(cyan → violet, used for the primary button and the brand mark) and three
new `--aurora-a/b/c` hues driving a soft background wash; `--shadow-float`,
a deeper multi-layer shadow for panels that need to read as genuinely
floating (drawers, the fixed hamburger); radii bumped again
(`--radius-md` 12→14, `--radius-lg` 24→28, new `--radius-xl` 32) for a
softer, more premium corner feel; a new `--z-fab: 350` sitting *above*
`--z-modal` — see the hamburger note below for why.

**Background wash (`base.css`)**: a second fixed pseudo-element,
`body::after`, layers three low-opacity (8-12%) radial gradient blobs in
the aurora palette on top of the existing starfield (`body::before`),
drifting over ~70s. Same non-negotiable rule as the starfield: if it ever
measurably hurts reading comfort, cut it.

**Cards (`content-card.js`, `chapter-card.js`, `stat-tile.js`,
`lab-callout.js`)**: glass surfaces (`--glass-bg-strong` + backdrop-filter
blur) with a faint accent-colored radial glow in one corner, replacing the
previous solid `--color-bg-raised` — restoring glassmorphism deliberately
reintroduced for premium *surfaces* here (unlike the earlier calm-UI
rebuild, which restricted glass to transient overlays only — that
restriction predates this explicit Aurora UI request and no longer
applies to cards). Hover now lifts (`translateY`) in addition to the
existing shadow deepen.

**Buttons (`base.css` `.btn--primary`/`.btn--ghost`)**: primary now fills
with `--gradient-primary` instead of a flat color; ghost's border/background
now reference the glass tokens directly instead of hardcoded ones.

**The table-of-contents drawer's backdrop was a real bug, not just a
style preference.** `<page-toc>`'s backdrop was `rgba(6, 11, 18, 0.4)` at
full opacity when open — a genuinely dark, fullscreen-feeling scrim, even
though the drawer itself only occupies 300px. Replaced with
`rgba(15, 23, 42, 0.1)` + a 1px blur: barely a dim, the lesson stays
clearly readable behind it. The exact same fix was applied to
`<app-sidebar>`'s backdrop for consistency. Both panels also picked up the
glass/shadow-float treatment and `page-toc`'s slide direction was already
correct (inline-end resolves to the physical left in the default Arabic/
RTL experience) — confirmed, not changed.

**The hamburger button move surfaced a real shadow-DOM stacking bug.**
Moving the sidebar toggle from an in-flow header button to a
`position: fixed` circle pinned to the physical top-left corner (`left`/
`top`, not logical properties — deliberately language-independent, like
the drawer it opens) seemed like a one-line change: give it a high
`z-index` and it should float above everything, including an open drawer.
It didn't. `<app-header>`'s own `:host` has `position: sticky` plus a
`z-index` — that combination creates a *stacking context*, and any
`position: fixed` descendant's z-index is only compared *within* that
context, not globally. The button's `z-index: 350` was winning against its
header siblings, but the *header itself* (as a stacking context) was still
just `z-index: 100`, which lost outright to `<app-sidebar>`'s `z-index:
300` — so the "escaped" fixed button rendered fully behind the open
drawer. Root-caused by comparing `document.elementFromPoint()` at the
button's own coordinates against the button's own reference (not just
eyeballing a screenshot, which alone wouldn't have distinguished "hidden
behind the drawer" from "never rendered"). Fixed by moving the button
entirely out of `<app-header>`'s shadow root into a real light-DOM
`<button class="aurora-menu-btn">` appended straight to `<body>` — the
same escape hatch `<app-sidebar>`/`<page-toc>` already use for their
backdrop divs — styled globally in `base.css` instead of the component's
shadow style. The lesson: a `position: fixed` element only escapes its
ancestor's *layout*; it does not escape the ancestor's *stacking context*
if that ancestor already created one.

**Simulations (`chapter-1.html`)**: all four `<sim-container class="sim-
frame">` instances' `max-width` reduced from 640px to 384px (~40%,
matching the ask) — `aspect-ratio` and centering untouched. Verified this
doesn't silently break interactivity: dragged the circular-motion
particle at the new size and re-read the live `v`/`a_c` readouts
(unaffected — they depend on ω and r, not screen size or drag angle), and
confirmed a canvas's fixed `pixelsPerUnit` scale still shows the full
scene un-clipped at default slider values, including the max-radius
slider position.

## Phase 9 — global drawer consistency pass (settings-panel was missed)

A follow-up global fix, prompted by re-reading the three navigation-style
drawers (`app-sidebar`, `page-toc`, `settings-panel`) side by side against
an explicit "no fullscreen dark overlay, rounded corner on the
content-facing edge" spec.

**`settings-panel.js` had never been touched in the Aurora pass.** It still
had a solid `--color-bg-raised` background and, more importantly, the
exact same class of bug Phase 8 fixed elsewhere: a fullscreen
`rgba(6, 11, 18, 0.5)` backdrop. Its "slide-in" was also cosmetic only — a
`display:none`/`block` toggle plus an opacity-only `@keyframes`, so it
popped into place rather than actually sliding. Rebuilt to the same
pattern as the other two: always-rendered `.panel` positioned via a real
`left` transition (−340px closed → 0 open), a light `rgba(15, 23, 42,
0.1)` + 1px-blur backdrop appended to `<body>`, glass surface, and
`--shadow-float`.

**The rounded-corner side was backwards on both existing drawers.**
`app-sidebar.js` and `page-toc.js` both anchor to the physical left edge,
but their corner-rounding used *logical* properties
(`border-start-end-radius`/`border-end-end-radius`, i.e. "round the
inline-end side"). In the default Arabic/RTL context inline-end resolves
to physical left — the edge flush against the viewport boundary, not the
edge facing the lesson content — so the rounded corners were on the wrong
side (and would silently move to the *other* wrong side in English/LTR,
since logical properties flip with `dir` but the drawers' actual position
is pinned with physical `left` on purpose). Fixed by switching to physical
`border-top-right-radius`/`border-bottom-right-radius` on all three
drawers, rounding only the content-facing right edge — stable in either
language, matching the explicit spec. Widened all three from 300px to a
consistent `min(320px, 88vw)`, landing centrally in the requested
300-340px range.

Re-verified with Playwright after the fix (not just re-read the CSS):
opened each of the three drawers and read back `getComputedStyle(...)
.borderTopRightRadius` vs `.borderTopLeftRadius` directly, rather than
trusting the source only — the first version of this exact fix, in Phase
8, had already gotten a very similar left/right radius call wrong once
before it was caught, which is why this round used measurement instead of
re-reasoning alone. Also re-confirmed click-outside-closes, ESC-closes,
and auto-close-on-link-select for both `app-sidebar` and `page-toc` — an
earlier combined test script produced a false negative on "click outside
closes" purely from a timing race between chained `page.evaluate` calls,
not a real bug; re-run in isolation with generous waits, all three
behaviors are confirmed correct.

## Phase 10 — the actual Aurora reference image, found and pixel-sampled

The "Aurora UI reference image" the brief referenced turned out to be real,
just not on this branch: `git log --all --diff-filter=A --name-only` found
`assets/pdf/file_000000004e988243bfeb6daaae8aac17_edit_466417681405453.png`
uploaded straight to `main` via GitHub's web UI, in history this feature
branch had never merged (this repo's app code only ever existed on the
feature branch; `main` only ever had the source PDFs). Extracted with `git
show origin/main:<path>`, copied into this branch at
`assets/design/aurora-reference.png`, and analyzed with Pillow
(`img.getpixel(...)`) rather than eyeballing it — sampling the heading
text and CTA button gradients directly turned up a **3-stop** cyan →
indigo → purple blend (landing almost exactly on Tailwind's cyan-400
`#22d3ee` / indigo-500 `#6366f1` / purple-400 `#c084fc`), not the 2-stop
cyan-violet gradient Phase 8 had guessed at without the image. `--gradient-
primary` and the `--aurora-a/b/c` hues (previously cyan/violet/*pink* —
the image's third hue is properly purple, not magenta) were corrected to
match.

**The home page hero was rebuilt to recreate the reference's actual
composition**, not just its color palette: a fixed near-black background
(`--color-hero-bg`, sampled ~`#04050f` — deliberately *not* tied to the
site's light/dark toggle, since the reference itself is a single fixed
dark scene, like a brand moment rather than a themeable surface), flowing
aurora-band glow, a scattered starfield, a 3-ring atom illustration
bottom-left, a ringed planet bottom-right, a dot-and-line constellation
top-right, and two faint tilted equation snippets ("F = ma", "E = mc²") —
matching the reference's layout corner-for-corner. Two real bugs surfaced
building this, both instructive beyond just this page:

- **A CSS `transform` completely replaces an SVG element's `transform`
  *attribute*, it doesn't compose with it.** The atom's three "orbit"
  ellipses each carry a static `transform="rotate(60 12 12)"` /
  `rotate(120 12 12)` attribute to fan them out 60° apart; animating
  rotation via CSS directly on those same ellipses silently erased that
  static offset, collapsing all three onto the same angle (rendering as a
  single blob, not a flower). Fixed by wrapping each ellipse in its own
  `<g transform="rotate(...)">` — the static offset lives on the
  (CSS-untouched) `<g>`, the animated spin lives on the child ellipse, and
  ordinary parent/child transform composition makes both apply.
- **Every hero decoration was mirrored to the wrong side at first**, for
  the exact reason Phase 9 had just documented for the drawers: using
  logical `inset-inline-start`/`-end` for elements meant to sit in *fixed
  physical* corners matching a reference image, not corners that should
  flip with `dir`. Switched every decoration (atom, planet, constellation,
  both equations) to physical `left`/`right`/`top`/`bottom`.
- A quieter bug in the same batch: `hsl(var(--aurora-a) / 0.8)` is *nested*
  `hsl()`, because `--aurora-a` is itself already a full `hsl(189 85% 60%)`
  value (unlike `--shadow-color`, which is deliberately a bare `H S% L%`
  triplet for exactly this kind of composition) — nesting a color function
  inside another color function's channel argument is invalid, and
  silently drops the entire declaration (computed `background-image:
  none`, not an error). Fixed with `color-mix(in srgb, var(--aurora-a) 80%,
  transparent)` throughout, matching the pattern `base.css`'s aurora wash
  already used correctly.

**The hamburger button gained the reference's gradient-ring border**, via
the standard two-layer trick (`background: <ring-gradient> border-box,
<glass-fill> padding-box` with a transparent `border`) — except a real
`background-color` can only be the shorthand's *last* layer while this
effect needs the *glass fill visually on top* (multiple background layers
paint first-listed-topmost), which are contradictory constraints for an
actual color value. Resolved by using a flat two-stop gradient of the same
glass color as an image instead of a real color, since images (unlike
colors) are allowed in any layer position.

**The sticky header now blends into the always-dark hero** via a
page-scoped custom-property override (`app-header { --glass-bg-strong:
rgba(4, 6, 20, 0.55); ... }` in `index.html` only) rather than touching
the shared component — relying on the same "custom properties inherit
across the shadow boundary even though rule matching doesn't" mechanism
already documented for `--anim-play` elsewhere in this file.

## What's deliberately not here yet

- No chapter-authoring pipeline from the source PDFs — Chapter 1 is
  hand-written; revisit once a second chapter makes the common shape clear.
- No test setup — added when there's non-trivial logic to test (physics
  simulation math, not UI chrome).
