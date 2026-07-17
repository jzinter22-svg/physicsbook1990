/*
  Clock — tracks simulation time independent of wall-clock frame timing.
  Every engine module that needs "how much time passed" (SimulationEngine,
  a standalone tween, a graph's x-axis) reads it from here rather than
  each rolling its own performance.now() bookkeeping.
*/
export class Clock {
  constructor({ maxDelta = 1 / 20 } = {}) {
    /** Hard cap on a single frame's delta (seconds) — guards against a huge
     * jump after a backgrounded tab or breakpoint (the "spiral of death"). */
    this.maxDelta = maxDelta;
    this.timeScale = 1;
    this.elapsed = 0;
    this._running = false;
    this._lastNow = 0;
  }

  get running() {
    return this._running;
  }

  start(now = performance.now()) {
    this._running = true;
    this._lastNow = now;
  }

  pause() {
    this._running = false;
  }

  reset() {
    this.elapsed = 0;
    this._lastNow = performance.now();
  }

  /**
   * Advance the clock to `now` and return this frame's scaled delta (seconds).
   * Returns 0 while paused — callers should skip stepping physics that frame.
   */
  tick(now = performance.now()) {
    if (!this._running) {
      this._lastNow = now;
      return 0;
    }
    const rawDelta = Math.min(Math.max((now - this._lastNow) / 1000, 0), this.maxDelta);
    this._lastNow = now;
    const scaled = rawDelta * this.timeScale;
    this.elapsed += scaled;
    return scaled;
  }
}

/**
 * Runs `callback(now)` on every animation frame while active — a thin,
 * testable wrapper around requestAnimationFrame so engines don't each
 * reimplement start/stop bookkeeping (and so tests can swap it out).
 */
export class FrameLoop {
  constructor(callback) {
    this._callback = callback;
    this._rafId = null;
    this._tick = (now) => {
      this._rafId = requestAnimationFrame(this._tick);
      this._callback(now);
    };
  }

  get running() {
    return this._rafId !== null;
  }

  start() {
    if (this.running) return;
    this._rafId = requestAnimationFrame(this._tick);
  }

  stop() {
    if (this._rafId !== null) cancelAnimationFrame(this._rafId);
    this._rafId = null;
  }
}
