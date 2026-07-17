/*
  SvgEngine — the retained-mode counterpart to CanvasEngine. SVG keeps shapes
  as real DOM nodes, so instead of clearing and redrawing every frame you
  create each shape once and update its attributes on subsequent frames —
  cheaper for scenes with a small, stable number of shapes (a diagram with a
  handful of labeled vectors) versus canvas's immediate-mode redraw-everything
  model. Same world-coordinate convention as CanvasEngine (Y-up, configurable
  origin, pixelsPerUnit) so the two are conceptually interchangeable.
*/

const SVG_NS = 'http://www.w3.org/2000/svg';

export class SvgEngine {
  /**
   * @param {HTMLElement} host
   * @param {object} [options]
   * @param {number} [options.pixelsPerUnit]
   * @param {'center'|'bottom-left'|'top-left'} [options.origin]
   * @param {string} [options.ariaLabel]
   */
  constructor(host, options = {}) {
    this.host = host;
    this.pixelsPerUnit = options.pixelsPerUnit ?? 100;
    this.origin = options.origin ?? 'center';

    this.svg = document.createElementNS(SVG_NS, 'svg');
    this.svg.setAttribute('role', 'img');
    if (options.ariaLabel) this.svg.setAttribute('aria-label', options.ariaLabel);
    this.svg.style.display = 'block';
    this.svg.style.width = '100%';
    this.svg.style.height = '100%';
    this.host.appendChild(this.svg);

    this._defs = document.createElementNS(SVG_NS, 'defs');
    this.svg.appendChild(this._defs);
    this._ensureArrowMarker();

    this.width = 0;
    this.height = 0;
    this._resizeObserver = new ResizeObserver(() => this._resize());
    this._resizeObserver.observe(this.host);
    this._resize();
  }

  _resize() {
    const { clientWidth: width, clientHeight: height } = this.host;
    this.width = width;
    this.height = height;
    this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    this.onResize?.(width, height);
  }

  _originPixels() {
    switch (this.origin) {
      case 'bottom-left':
        return { x: 0, y: this.height };
      case 'top-left':
        return { x: 0, y: 0 };
      case 'center':
      default:
        return { x: this.width / 2, y: this.height / 2 };
    }
  }

  toScreen(point) {
    const o = this._originPixels();
    return {
      x: o.x + point.x * this.pixelsPerUnit,
      y: o.y - point.y * this.pixelsPerUnit,
    };
  }

  toWorld(point) {
    const o = this._originPixels();
    return {
      x: (point.x - o.x) / this.pixelsPerUnit,
      y: (o.y - point.y) / this.pixelsPerUnit,
    };
  }

  clientToWorld(clientX, clientY) {
    const rect = this.svg.getBoundingClientRect();
    return this.toWorld({ x: clientX - rect.left, y: clientY - rect.top });
  }

  /** Escape hatch: create any SVG element with the given attributes, appended to the scene (or `parent`). */
  create(tag, attrs = {}, parent = this.svg) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
    parent.appendChild(el);
    return el;
  }

  createGroup(attrs = {}) {
    return this.create('g', attrs);
  }

  createCircle(center, radius, attrs = {}) {
    const p = this.toScreen(center);
    return this.create('circle', { cx: p.x, cy: p.y, r: radius * this.pixelsPerUnit, ...attrs });
  }

  updateCircle(el, center, radius) {
    const p = this.toScreen(center);
    el.setAttribute('cx', p.x);
    el.setAttribute('cy', p.y);
    if (radius != null) el.setAttribute('r', radius * this.pixelsPerUnit);
  }

  createLine(from, to, attrs = {}) {
    const a = this.toScreen(from);
    const b = this.toScreen(to);
    return this.create('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: '#fff', 'stroke-width': 2, ...attrs });
  }

  updateLine(el, from, to) {
    const a = this.toScreen(from);
    const b = this.toScreen(to);
    el.setAttribute('x1', a.x);
    el.setAttribute('y1', a.y);
    el.setAttribute('x2', b.x);
    el.setAttribute('y2', b.y);
  }

  _ensureArrowMarker() {
    if (this._defs.querySelector('#svg-engine-arrowhead')) return;
    const marker = this.create(
      'marker',
      {
        id: 'svg-engine-arrowhead',
        markerWidth: 8,
        markerHeight: 8,
        refX: 6,
        refY: 4,
        orient: 'auto',
      },
      this._defs
    );
    this.create('path', { d: 'M0 0 L8 4 L0 8 Z', fill: 'context-stroke' }, marker);
  }

  /** A line with an arrowhead — the standard way to draw a vector (force, velocity, ...). */
  createArrow(from, to, attrs = {}) {
    const line = this.createLine(from, to, { 'marker-end': 'url(#svg-engine-arrowhead)', ...attrs });
    return line;
  }

  updateArrow(el, from, to) {
    this.updateLine(el, from, to);
  }

  createText(text, position, attrs = {}) {
    const p = this.toScreen(position);
    const el = this.create('text', {
      x: p.x,
      y: p.y,
      fill: '#fff',
      'text-anchor': 'middle',
      'dominant-baseline': 'middle',
      ...attrs,
    });
    el.textContent = text;
    return el;
  }

  updateText(el, text, position) {
    if (position) {
      const p = this.toScreen(position);
      el.setAttribute('x', p.x);
      el.setAttribute('y', p.y);
    }
    if (text != null) el.textContent = text;
  }

  /** A reference grid, spaced every `spacing` world units. */
  drawGrid(spacing = 1, attrs = {}) {
    this._gridGroup?.remove();
    this._gridGroup = this.createGroup({ class: 'svg-engine-grid' });
    const o = this._originPixels();
    const step = spacing * this.pixelsPerUnit;
    const lineAttrs = { stroke: 'rgba(255,255,255,0.08)', 'stroke-width': 1, ...attrs };
    for (let x = o.x % step; x <= this.width; x += step) {
      this.create('line', { x1: x, y1: 0, x2: x, y2: this.height, ...lineAttrs }, this._gridGroup);
    }
    for (let y = o.y % step; y <= this.height; y += step) {
      this.create('line', { x1: 0, y1: y, x2: this.width, y2: y, ...lineAttrs }, this._gridGroup);
    }
  }

  clear() {
    while (this.svg.lastChild && this.svg.lastChild !== this._defs) {
      this.svg.removeChild(this.svg.lastChild);
    }
    this._gridGroup = null;
  }

  destroy() {
    this._resizeObserver.disconnect();
    this.svg.remove();
  }
}
