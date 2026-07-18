import { Clock, FrameLoop } from './animation-engine.js';

/**
 * SimulationEngine — a fixed-timestep physics loop decoupled from the
 * variable render rate ("fix your timestep": physics steps always advance
 * by the same `fixedDt`, however many display frames actually rendered
 * in between). This is what makes numerical integration (velocity/position
 * updates) behave identically at 60 Hz, 120 Hz, or a throttled background
 * tab, instead of drifting or blowing up.
 *
 * Usage:
 *   const engine = new SimulationEngine({
 *     step: (dt) => { velocity.addScaled(acceleration, dt); position.addScaled(velocity, dt); },
 *     render: (alpha) => draw(position),   // alpha: 0..1 progress into the next physics step
 *     reset: () => { position.set(0, 0); velocity.set(0, 0); },
 *   });
 *   engine.start();
 *
 * `step`/`render`/`reset` are all optional so the engine also works as a
 * plain animation driver (render-only, no physics) or a headless physics
 * runner (step-only, no rendering) — see also <sim-play-toggle> etc. for
 * UI controls that talk to an engine instance via its start/pause/reset API.
 */
export class SimulationEngine {
  constructor({ step, render, reset, fixedDt = 1 / 120, maxSubSteps = 5 } = {}) {
    this._step = step;
    this._render = render;
    this._onReset = reset;
    this.fixedDt = fixedDt;
    this.maxSubSteps = maxSubSteps;

    this.clock = new Clock();
    this._accumulator = 0;
    this._loop = new FrameLoop((now) => this._onFrame(now));
  }

  get running() {
    return this.clock.running;
  }

  get timeScale() {
    return this.clock.timeScale;
  }

  set timeScale(value) {
    this.clock.timeScale = value;
  }

  start() {
    if (this.running) return;
    this.clock.start();
    this._loop.start();
  }

  pause() {
    this.clock.pause();
    this._loop.stop();
  }

  reset() {
    this.pause();
    this._accumulator = 0;
    this.clock.reset();
    this._onReset?.();
    this._render?.(0);
  }

  destroy() {
    this.pause();
  }

  _onFrame(now) {
    const delta = this.clock.tick(now);
    this._accumulator += delta;

    let subSteps = 0;
    while (this._accumulator >= this.fixedDt && subSteps < this.maxSubSteps) {
      this._step?.(this.fixedDt);
      this._accumulator -= this.fixedDt;
      subSteps += 1;
    }
    // If the accumulator is still saturated (tab was backgrounded, or `step`
    // is too expensive for the frame budget) drop the remainder rather than
    // spiral trying to catch up forever.
    if (subSteps === this.maxSubSteps) this._accumulator = 0;

    this._render?.(this._accumulator / this.fixedDt);
  }
}
