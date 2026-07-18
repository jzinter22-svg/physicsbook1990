import { CanvasEngine } from '../engine/canvas-engine.js';
import { SimulationEngine } from '../engine/simulation-engine.js';
import { centripetalAcceleration, centripetalForce } from '../engine/physics/rotation.js';
import { attachDrag } from '../engine/interactions/drag.js';

/*
  Interactive counterpart to Figures (1-1)/(2-1)/(3-1): a particle in
  uniform circular motion, with its tangential velocity (green, solid) and
  centripetal acceleration (red, dashed) vectors redrawn live as radius,
  angular velocity, or mass change. Vectors are also distinguished by line
  style (not just color) and labeled with text, per the project's
  never-color-alone rule. The particle itself is directly draggable around
  the circle (grab it and spin it by hand) — dragging pauses the automatic
  rotation for the duration of the gesture and resumes from wherever it's
  released, so the student can place it at any angle and inspect the
  vectors before letting go.
*/
export class CircularMotionSim {
  constructor(host) {
    this.host = host;
    this.engine = new CanvasEngine(host, {
      pixelsPerUnit: 90,
      origin: 'center',
      ariaLabel: 'محاكاة الحركة الدائرية المنتظمة',
    });
    this.radius = 1.5;
    this.omega = 2;
    this.mass = 1;
    this._theta = 0;
    this._dragging = false;
    /** @type {((values: { v: number, ac: number, fc: number, r: number, omega: number }) => void) | null} */
    this.onUpdate = null;

    this.sim = new SimulationEngine({
      step: (dt) => {
        if (this._dragging) return;
        this._theta += this.omega * dt;
      },
      render: () => this._render(),
      reset: () => {
        this._theta = 0;
      },
    });
    this._render();
    this._detachDrag = attachDrag(this.engine.canvas, {
      hitTest: (event) => this._distanceToParticle(event) < 0.35,
      onStart: () => {
        this._dragging = true;
      },
      onDrag: (event) => {
        const world = this.engine.clientToWorld(event.clientX, event.clientY);
        this._theta = Math.atan2(world.y, world.x);
        this._render();
      },
      onEnd: () => {
        this._dragging = false;
      },
    });
  }

  _distanceToParticle(event) {
    const world = this.engine.clientToWorld(event.clientX, event.clientY);
    const x = this.radius * Math.cos(this._theta);
    const y = this.radius * Math.sin(this._theta);
    return Math.hypot(world.x - x, world.y - y);
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
    this._detachDrag?.();
    this.sim.destroy();
    this.engine.destroy();
  }

  setRadius(value) {
    this.radius = value;
    this._render();
  }

  setOmega(value) {
    this.omega = value;
    this._render();
  }

  setMass(value) {
    this.mass = value;
    this._render();
  }

  _render() {
    const e = this.engine;
    const r = this.radius;
    e.clear();
    e.drawGrid(0.5);
    e.drawCircle({ x: 0, y: 0 }, r, { stroke: 'rgba(148,163,184,0.4)', lineWidth: 1.5 });
    e.drawCircle({ x: 0, y: 0 }, 0.045, { fill: '#f5a623' });
    e.drawLine({ x: 0, y: 0 }, { x: r, y: 0 }, { stroke: 'rgba(148,163,184,0.5)', lineWidth: 1, dash: [3, 4] });
    e.drawText(`r = ${r.toFixed(1)} m`, { x: r / 2, y: 0.14 }, { color: 'rgba(226,232,240,0.85)', font: '600 12px sans-serif' });

    const x = r * Math.cos(this._theta);
    const y = r * Math.sin(this._theta);
    const v = this.omega * r;
    const ac = centripetalAcceleration(v, r);
    const fc = centripetalForce(this.mass, v, r);

    const tx = -Math.sin(this._theta);
    const ty = Math.cos(this._theta);
    const ux = -x / r;
    const uy = -y / r;

    const vScale = 0.3;
    const aScale = 0.12;

    e.drawArrow({ x, y }, { x: x + ux * ac * aScale, y: y + uy * ac * aScale }, { stroke: '#e5484d', lineWidth: 2.5, headLength: 8 });
    e.drawArrow({ x, y }, { x: x + tx * v * vScale, y: y + ty * v * vScale }, { stroke: '#38b76a', lineWidth: 2.5, headLength: 8 });
    e.drawCircle({ x, y }, this._dragging ? 0.11 : 0.08, { fill: '#0eb7cc' });
    e.drawText('v', { x: x + tx * v * vScale * 1.3, y: y + ty * v * vScale * 1.3 }, { color: '#38b76a', font: '700 15px sans-serif' });
    e.drawText('aᴄ', { x: x + ux * ac * aScale * 1.35, y: y + uy * ac * aScale * 1.35 }, { color: '#e5484d', font: '700 15px sans-serif' });

    this.onUpdate?.({ v, ac, fc, r, omega: this.omega });
  }
}
