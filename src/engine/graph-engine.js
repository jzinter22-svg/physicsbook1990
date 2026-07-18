/*
  GraphEngine — a live-updating line plot for a physics quantity over time
  (or against any other quantity): position vs t, velocity vs t, energy vs
  position, and so on. Generic and domain-agnostic — it just plots numbers.

  Unlike CanvasEngine's fixed physics-world scale, a live readout's axes need
  to auto-scale as new data arrives, so this owns a simpler, separate
  data-space -> pixel mapping recomputed each render from the visible buffer.
*/
export class GraphEngine {
  /**
   * @param {HTMLElement} host
   * @param {object} [options]
   * @param {number} [options.maxPoints] Rolling buffer size (oldest points drop off).
   * @param {number} [options.yMin] Fix the y-axis minimum instead of auto-scaling.
   * @param {number} [options.yMax] Fix the y-axis maximum instead of auto-scaling.
   * @param {string} [options.color] Line color (CSS color or custom-property value).
   * @param {string} [options.ariaLabel]
   */
  constructor(host, options = {}) {
    this.host = host;
    this.maxPoints = options.maxPoints ?? 300;
    this.fixedYMin = options.yMin;
    this.fixedYMax = options.yMax;
    this.color = options.color ?? '#0eb7cc';
    this._points = [];

    this.canvas = document.createElement('canvas');
    this.canvas.style.display = 'block';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.setAttribute('role', 'img');
    this.canvas.setAttribute('aria-label', options.ariaLabel ?? 'Live data graph');
    this.host.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    this._resizeObserver = new ResizeObserver(() => this._resize());
    this._resizeObserver.observe(this.host);
    this._resize();
  }

  _resize() {
    const dpr = window.devicePixelRatio || 1;
    const { clientWidth: width, clientHeight: height } = this.host;
    this.width = width;
    this.height = height;
    this.canvas.width = Math.max(1, Math.round(width * dpr));
    this.canvas.height = Math.max(1, Math.round(height * dpr));
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.render();
  }

  /** Append a sample and re-render. `x` is typically elapsed time. */
  addPoint(x, y) {
    this._points.push({ x, y });
    if (this._points.length > this.maxPoints) this._points.shift();
    this.render();
  }

  clear() {
    this._points = [];
    this.render();
  }

  render() {
    const ctx = this.ctx;
    const { width, height } = this;
    ctx.clearRect(0, 0, width, height);
    if (!this._points.length) return;

    const xs = this._points.map((p) => p.x);
    const ys = this._points.map((p) => p.y);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const yMin = this.fixedYMin ?? Math.min(...ys);
    const yMax = this.fixedYMax ?? Math.max(...ys);
    const xRange = xMax - xMin || 1;
    const yRange = yMax - yMin || 1;

    const pad = { left: 8, right: 8, top: 8, bottom: 8 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;

    const toPixel = (p) => ({
      x: pad.left + ((p.x - xMin) / xRange) * plotW,
      y: pad.top + plotH - ((p.y - yMin) / yRange) * plotH,
    });

    // Recessive gridlines (zero line emphasized if it's within range).
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < 4; i += 1) {
      const y = pad.top + (plotH * i) / 4;
      ctx.moveTo(pad.left, y);
      ctx.lineTo(width - pad.right, y);
    }
    ctx.stroke();

    if (yMin < 0 && yMax > 0) {
      const zeroY = toPixel({ x: xMin, y: 0 }).y;
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.moveTo(pad.left, zeroY);
      ctx.lineTo(width - pad.right, zeroY);
      ctx.stroke();
    }

    // The trace itself: a single thin line, direct — no legend needed for one series.
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    this._points.forEach((p, i) => {
      const px = toPixel(p);
      if (i === 0) ctx.moveTo(px.x, px.y);
      else ctx.lineTo(px.x, px.y);
    });
    ctx.stroke();

    // Direct label at the current (last) value.
    const last = toPixel(this._points[this._points.length - 1]);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(last.x, last.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  destroy() {
    this._resizeObserver.disconnect();
    this.canvas.remove();
  }
}
