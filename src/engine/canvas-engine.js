/*
  CanvasEngine — a 2D canvas wrapped with a physics-friendly coordinate
  system (world units, Y-up, origin wherever you want it) and a small set
  of draw primitives (circle, line, arrow, grid, text) that take world
  coordinates and handle the Y-flip / scale / DPR math once, centrally,
  instead of every simulation reinventing it.
*/
export class CanvasEngine {
  /**
   * @param {HTMLElement} host Element the canvas fills (position:relative recommended).
   * @param {object} [options]
   * @param {number} [options.pixelsPerUnit] Scale — screen pixels per 1 world unit.
   * @param {'center'|'bottom-left'|'top-left'} [options.origin] Where world (0,0) sits on screen.
   * @param {string} [options.ariaLabel] Accessible label — canvas content is invisible to a screen reader otherwise.
   */
  constructor(host, options = {}) {
    this.host = host;
    this.pixelsPerUnit = options.pixelsPerUnit ?? 100;
    this.origin = options.origin ?? 'center';

    this.canvas = document.createElement('canvas');
    this.canvas.style.display = 'block';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.setAttribute('role', 'img');
    if (options.ariaLabel) this.canvas.setAttribute('aria-label', options.ariaLabel);
    this.host.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    this.width = 0;
    this.height = 0;
    this._resizeObserver = new ResizeObserver(() => this._resize());
    this._resizeObserver.observe(this.host);
    this._resize();
  }

  _resize() {
    const dpr = window.devicePixelRatio || 1;
    const { clientWidth: width, clientHeight: height } = this.host;
    const pixelWidth = Math.max(1, Math.round(width * dpr));
    const pixelHeight = Math.max(1, Math.round(height * dpr));

    // ResizeObserver is guaranteed to fire once asynchronously right after
    // observe() even when nothing actually changed size — and assigning
    // canvas.width/height, even to their current value, implicitly clears
    // the bitmap. Skip the reassignment (and the resulting wipe of whatever
    // was already drawn) when the pixel size hasn't actually changed.
    const unchanged = this.canvas.width === pixelWidth && this.canvas.height === pixelHeight;
    this.width = width;
    this.height = height;
    if (unchanged) return;

    this.canvas.width = pixelWidth;
    this.canvas.height = pixelHeight;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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

  /** World {x,y} -> screen pixel {x,y}. */
  toScreen(point) {
    const o = this._originPixels();
    return {
      x: o.x + point.x * this.pixelsPerUnit,
      y: o.y - point.y * this.pixelsPerUnit,
    };
  }

  /** Screen pixel {x,y} -> world {x,y} — e.g. to convert a pointer event. */
  toWorld(point) {
    const o = this._originPixels();
    return {
      x: (point.x - o.x) / this.pixelsPerUnit,
      y: (o.y - point.y) / this.pixelsPerUnit,
    };
  }

  /** Convert a client (viewport) point — e.g. from a PointerEvent — to world coordinates. */
  clientToWorld(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    return this.toWorld({ x: clientX - rect.left, y: clientY - rect.top });
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  drawCircle(center, radius, { fill, stroke, lineWidth = 2 } = {}) {
    const p = this.toScreen(center);
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius * this.pixelsPerUnit, 0, Math.PI * 2);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
  }

  drawLine(from, to, { stroke = '#fff', lineWidth = 2, dash = [] } = {}) {
    const a = this.toScreen(from);
    const b = this.toScreen(to);
    const ctx = this.ctx;
    ctx.save();
    ctx.setLineDash(dash);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.restore();
  }

  /** An arrow from `from` to `to` — the standard way to draw a vector (force, velocity, ...). */
  drawArrow(from, to, { stroke = '#fff', lineWidth = 2, headLength = 10 } = {}) {
    const a = this.toScreen(from);
    const b = this.toScreen(to);
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    const ctx = this.ctx;
    ctx.strokeStyle = stroke;
    ctx.fillStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x - headLength * Math.cos(angle - Math.PI / 6), b.y - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(b.x - headLength * Math.cos(angle + Math.PI / 6), b.y - headLength * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  }

  drawText(text, position, { color = '#fff', font = '13px sans-serif', align = 'center', baseline = 'middle' } = {}) {
    const p = this.toScreen(position);
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.font = font;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    ctx.fillText(text, p.x, p.y);
  }

  /** A reference grid, spaced every `spacing` world units. */
  drawGrid(spacing = 1, { stroke = 'rgba(255,255,255,0.08)', lineWidth = 1 } = {}) {
    const ctx = this.ctx;
    const o = this._originPixels();
    const step = spacing * this.pixelsPerUnit;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    for (let x = o.x % step; x <= this.width; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
    }
    for (let y = o.y % step; y <= this.height; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
    }
    ctx.stroke();
  }

  destroy() {
    this._resizeObserver.disconnect();
    this.canvas.remove();
  }
}
