/*
  Base class for canvas-driven interactive simulations.

  Future chapters will subclass `Simulation` and implement `update(dt)` and
  `render(ctx)`. This class owns the parts every simulation needs regardless
  of the physics involved: a resize-aware canvas, a fixed-timestep-friendly
  animation loop, play/pause/reset state, and cleanup so simulations don't
  leak listeners when a chapter page unmounts them.
*/

export class Simulation {
  /**
   * @param {HTMLElement} host Element the canvas is mounted into (fills it).
   * @param {object} [options]
   * @param {number} [options.maxDt] Clamp large frame gaps (e.g. tab was backgrounded).
   */
  constructor(host, options = {}) {
    this.host = host;
    this.maxDt = options.maxDt ?? 1 / 30;

    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('role', 'img');
    this.host.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    this._running = false;
    this._rafId = null;
    this._lastTime = 0;

    this._resizeObserver = new ResizeObserver(() => this._handleResize());
    this._resizeObserver.observe(this.host);
    this._handleResize();
  }

  get running() {
    return this._running;
  }

  _handleResize() {
    const dpr = window.devicePixelRatio || 1;
    const { clientWidth: width, clientHeight: height } = this.host;
    this.canvas.width = Math.max(1, Math.round(width * dpr));
    this.canvas.height = Math.max(1, Math.round(height * dpr));
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.onResize?.(width, height);
    if (!this._running) this.render(this.ctx);
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._lastTime = performance.now();
    this._rafId = requestAnimationFrame(this._tick);
  }

  pause() {
    this._running = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._rafId = null;
  }

  reset() {
    this.pause();
    this.onReset?.();
    this.render(this.ctx);
  }

  destroy() {
    this.pause();
    this._resizeObserver.disconnect();
    this.canvas.remove();
  }

  _tick = (time) => {
    if (!this._running) return;
    const dt = Math.min((time - this._lastTime) / 1000, this.maxDt);
    this._lastTime = time;
    this.update(dt);
    this.render(this.ctx);
    this._rafId = requestAnimationFrame(this._tick);
  };

  /** Override in subclasses. @param {number} dt seconds since last frame */
  update(dt) {} // eslint-disable-line no-unused-vars

  /** Override in subclasses. @param {CanvasRenderingContext2D} ctx */
  render(ctx) {} // eslint-disable-line no-unused-vars

  /** Optional override, called after every resize. */
  onResize(width, height) {} // eslint-disable-line no-unused-vars

  /** Optional override, called on reset() before the next render. */
  onReset() {}
}
