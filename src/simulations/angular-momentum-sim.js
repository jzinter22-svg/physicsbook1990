import { CanvasEngine } from '../engine/canvas-engine.js';
import { SimulationEngine } from '../engine/simulation-engine.js';
import { momentOfInertia, angularMomentum } from '../engine/physics/rotation.js';
import { attachDrag } from '../engine/interactions/drag.js';

const MIN_RADIUS = 0.3;
const MAX_RADIUS = 1.2;

/*
  Conservation of angular momentum (section 8-1): two point masses ("arms")
  spin about a fixed body at radius r. Dragging the radius slider mimics a
  skater or diver pulling their arms/body in — L = I*omega stays fixed at
  whatever value it had at the last reset, so reducing r (which reduces I)
  forces omega to rise, and vice versa. This is the same mechanism behind
  the textbook's diver example (9-1, Q2-4) and the flywheel "did you know".
*/
export class AngularMomentumSim {
  constructor(host) {
    this.host = host;
    this.engine = new CanvasEngine(host, {
      pixelsPerUnit: 110,
      origin: 'center',
      ariaLabel: 'محاكاة حفظ الزخم الزاوي',
    });
    this.bodyInertia = 0.15;
    this.armMass = 3;
    this.r = 0.9;
    this._omega0 = 4;
    this._phi = 0;
    this.L = angularMomentum(this._momentOfInertia(), this._omega0);
    this._dragging = false;
    /** @type {((values: { I: number, omega: number, L: number, ke: number, r: number }) => void) | null} */
    this.onUpdate = null;

    this.sim = new SimulationEngine({
      step: (dt) => {
        if (this._dragging) return;
        this._phi += this._omega() * dt;
      },
      render: () => this._render(),
      reset: () => {
        this._phi = 0;
        this.r = 0.9;
        this.L = angularMomentum(this._momentOfInertia(), this._omega0);
      },
    });
    this._render();
    // Grab either arm mass and pull it in/out directly — only the pointer's
    // radial distance from the pivot matters. Rotation pauses for the
    // duration of the gesture (same as the other two sims) so a fast spin
    // doesn't carry the mass out from under the student's finger mid-drag;
    // it resumes at the new (conserved-L) rate the instant they let go.
    this._detachDrag = attachDrag(this.engine.canvas, {
      hitTest: (event) => this._distanceToNearestArm(event) < 0.4,
      onStart: () => {
        this._dragging = true;
      },
      onDrag: (event) => {
        const world = this.engine.clientToWorld(event.clientX, event.clientY);
        const radius = Math.hypot(world.x, world.y);
        this.setRadius(Math.min(MAX_RADIUS, Math.max(MIN_RADIUS, radius)));
      },
      onEnd: () => {
        this._dragging = false;
      },
    });
  }

  _distanceToNearestArm(event) {
    const world = this.engine.clientToWorld(event.clientX, event.clientY);
    const distances = [1, -1].map((sign) => {
      const ax = this.r * Math.cos(this._phi) * sign;
      const ay = this.r * Math.sin(this._phi) * sign;
      return Math.hypot(world.x - ax, world.y - ay);
    });
    return Math.min(...distances);
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
    this.r = value;
    this._render();
  }

  _momentOfInertia() {
    return this.bodyInertia + 2 * momentOfInertia.pointMass(this.armMass, this.r);
  }

  _omega() {
    return this.L / this._momentOfInertia();
  }

  _render() {
    const e = this.engine;
    e.clear();
    e.drawGrid(0.5);

    const I = this._momentOfInertia();
    const omega = this._omega();
    const ke = 0.5 * I * omega * omega;

    e.drawCircle({ x: 0, y: 0 }, 0.18, { fill: '#2a78d6' });
    for (const sign of [1, -1]) {
      const ax = this.r * Math.cos(this._phi) * sign;
      const ay = this.r * Math.sin(this._phi) * sign;
      e.drawLine({ x: 0, y: 0 }, { x: ax, y: ay }, { stroke: 'rgba(148,163,184,0.6)', lineWidth: 3 });
      e.drawCircle({ x: ax, y: ay }, this._dragging ? 0.12 : 0.09, { fill: '#f5a623' });
    }
    e.drawText(`r = ${this.r.toFixed(2)} m`, { x: 0, y: -this.r - 0.22 }, { color: 'rgba(226,232,240,0.85)', font: '600 12px sans-serif' });

    this.onUpdate?.({ I, omega, L: this.L, ke, r: this.r });
  }
}
