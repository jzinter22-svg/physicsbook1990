import { CanvasEngine } from '../engine/canvas-engine.js';
import { SimulationEngine } from '../engine/simulation-engine.js';

/*
  Interactive counterpart to Figures (4-1)/(5-1)/(6-1): a body orbits a
  fixed focus (the center of gravity) on an ellipse whose eccentricity is
  adjustable, sweeping the trailing shaded sector at a constant rate — a
  direct, numerically-correct demonstration of Kepler's first two laws
  (elliptical path around a focus; equal areas in equal times) rather than
  just a static illustration of them.

  Physics: true-anomaly parametrization r(theta) = a(1-e^2)/(1+e*cos(theta))
  with focus at the origin. Conservation of angular momentum gives
  dtheta/dt = k / r(theta)^2 for a constant k, which is exactly what makes
  the body sweep equal areas in equal times (dA/dt = 1/2 r^2 dtheta/dt = k/2
  is constant by construction) — the standard result used to derive Kepler's
  second law from angular momentum conservation.
*/
export class KeplerOrbitSim {
  constructor(host) {
    this.host = host;
    this.engine = new CanvasEngine(host, {
      pixelsPerUnit: 130,
      origin: 'center',
      ariaLabel: 'محاكاة مدارات الاقمار الاصطناعية وقوانين كبلر',
    });
    this.a = 1.3;
    this.e = 0.3;
    this._baseOmega = 1.1;
    this._theta = 0;
    this._totalTheta = 0;
    this._history = [];
    this._lag = 1.4;
    /** @type {((values: { r: number, thetaDot: number }) => void) | null} */
    this.onUpdate = null;

    this.sim = new SimulationEngine({
      step: (dt) => this._step(dt),
      render: () => this._render(),
      reset: () => {
        this._theta = 0;
        this._totalTheta = 0;
        this._history = [];
      },
    });
    this._render();
  }

  get running() {
    return this.sim.running;
  }

  start() {
    this.sim.start();
  }

  pause() {
    this.sim.pause();
  }

  reset() {
    this.sim.reset();
  }

  destroy() {
    this.sim.destroy();
    this.engine.destroy();
  }

  setEccentricity(value) {
    this.e = value;
    this._render();
  }

  _radiusAt(theta) {
    const { a, e } = this;
    return (a * (1 - e * e)) / (1 + e * Math.cos(theta));
  }

  _k() {
    // Same specific angular momentum magnitude scale for every eccentricity,
    // consistent with h = sqrt(GM * a * (1 - e^2)) at fixed semi-major axis a.
    return this._baseOmega * this.a * this.a * Math.sqrt(1 - this.e * this.e);
  }

  _step(dt) {
    const r = this._radiusAt(this._theta);
    const thetaDot = this._k() / (r * r);
    this._theta = (this._theta + thetaDot * dt) % (Math.PI * 2);
    this._totalTheta += thetaDot * dt;
    this._history.push({ t: this.sim.clock.elapsed, theta: this._totalTheta });
    const cutoff = this.sim.clock.elapsed - this._lag * 2;
    while (this._history.length > 2 && this._history[0].t < cutoff) this._history.shift();
  }

  _thetaAtLag() {
    const targetT = this.sim.clock.elapsed - this._lag;
    const hist = this._history;
    if (hist.length < 2) return this._totalTheta;
    if (targetT <= hist[0].t) return hist[0].theta;
    for (let i = 1; i < hist.length; i++) {
      if (hist[i].t >= targetT) {
        const a = hist[i - 1];
        const b = hist[i];
        const span = b.t - a.t || 1;
        const f = (targetT - a.t) / span;
        return a.theta + (b.theta - a.theta) * f;
      }
    }
    return this._totalTheta;
  }

  _sectorPoints(thetaStart, thetaEnd, steps = 28) {
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const th = thetaStart + (thetaEnd - thetaStart) * (i / steps);
      const r = this._radiusAt(th);
      pts.push({ x: r * Math.cos(th), y: r * Math.sin(th) });
    }
    return pts;
  }

  _render() {
    const e = this.engine;
    e.clear();
    e.drawGrid(0.5);

    // Static orbit path.
    const path = this._sectorPoints(0, Math.PI * 2, 96);
    const ctx = e.ctx;
    ctx.save();
    ctx.strokeStyle = 'rgba(148,163,184,0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    path.forEach((p, i) => {
      const s = e.toScreen(p);
      if (i === 0) ctx.moveTo(s.x, s.y);
      else ctx.lineTo(s.x, s.y);
    });
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // Swept-area sector trailing the body over a fixed time lag — equal in
    // area near perihelion and aphelion despite the very different arc shape.
    if (this.sim.running) {
      const thetaLag = this._thetaAtLag();
      const sectorPts = this._sectorPoints(thetaLag, this._totalTheta, 24);
      const focusScreen = e.toScreen({ x: 0, y: 0 });
      ctx.save();
      ctx.fillStyle = 'rgba(14, 183, 204, 0.32)';
      ctx.beginPath();
      ctx.moveTo(focusScreen.x, focusScreen.y);
      sectorPts.forEach((p) => {
        const s = e.toScreen(p);
        ctx.lineTo(s.x, s.y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Focus (center of gravity).
    e.drawCircle({ x: 0, y: 0 }, 0.08, { fill: '#f5a623' });

    // Orbiting body.
    const r = this._radiusAt(this._theta);
    const pos = { x: r * Math.cos(this._theta), y: r * Math.sin(this._theta) };
    e.drawCircle(pos, 0.07, { fill: '#0eb7cc' });
    e.drawLine({ x: 0, y: 0 }, pos, { stroke: 'rgba(14,183,204,0.6)', lineWidth: 1.5, dash: [4, 4] });

    const thetaDot = this._k() / (r * r);
    this.onUpdate?.({ r, thetaDot });
  }
}
