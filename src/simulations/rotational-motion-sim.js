import { CanvasEngine } from '../engine/canvas-engine.js';
import { SimulationEngine } from '../engine/simulation-engine.js';
import { momentOfInertia, torqueFromForce } from '../engine/physics/rotation.js';
import { attachDrag } from '../engine/interactions/drag.js';

/*
  Interactive counterpart to section 5-1 (angular displacement/velocity/
  acceleration, moment of inertia, τ = Iα): a solid disk driven by a
  tangential force applied at its rim. τ = F·r and I = ½mr² (solid disk,
  Table 2-1) combine into α = τ/I, which is then integrated the same way
  uniform circular motion's ω is — a direct, numeric demonstration of
  equations (13)-(18), not just a static labeled diagram.

  The disk's rim marker is directly draggable (grab it and spin the disk by
  hand), pausing the automatic integration for the gesture, same convention
  as the other two sims in this chapter.
*/
export class RotationalMotionSim {
  constructor(host) {
    this.host = host;
    this.engine = new CanvasEngine(host, {
      pixelsPerUnit: 90,
      origin: 'center',
      ariaLabel: 'محاكاة الحركة الدورانية والعزم المدوّر',
    });
    this.mass = 2;
    this.radius = 1.2;
    this.force = 3;
    this._theta = 0;
    this._omega = 0;
    this._dragging = false;
    /** @type {((values: { theta: number, omega: number, alpha: number, torque: number, I: number }) => void) | null} */
    this.onUpdate = null;

    this.sim = new SimulationEngine({
      step: (dt) => this._step(dt),
      render: () => this._render(),
      reset: () => {
        this._theta = 0;
        this._omega = 0;
      },
    });
    this._render();
    this._detachDrag = attachDrag(this.engine.canvas, {
      hitTest: (event) => this._distanceToMarker(event) < 0.35,
      onStart: () => {
        this._dragging = true;
      },
      onDrag: (event) => {
        const world = this.engine.clientToWorld(event.clientX, event.clientY);
        this._theta = Math.atan2(world.y, world.x);
        this._omega = 0;
        this._render();
      },
      onEnd: () => {
        this._dragging = false;
      },
    });
  }

  _distanceToMarker(event) {
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

  setSpeed(value) {
    this.sim.timeScale = value;
  }

  setMass(value) {
    this.mass = value;
    this._render();
  }

  setRadius(value) {
    this.radius = value;
    this._render();
  }

  setForce(value) {
    this.force = value;
    this._render();
  }

  _step(dt) {
    if (this._dragging) return;
    const I = momentOfInertia.solidDisk(this.mass, this.radius);
    const torque = torqueFromForce(this.force, this.radius);
    const alpha = torque / I;
    this._omega += alpha * dt;
    this._theta += this._omega * dt;
  }

  _render() {
    const e = this.engine;
    const r = this.radius;
    const I = momentOfInertia.solidDisk(this.mass, r);
    const torque = torqueFromForce(this.force, r);
    const alpha = torque / I;

    e.clear();
    e.drawGrid(0.5);

    // The disk itself (filled, faint) plus a spoke marking current angular position.
    e.drawCircle({ x: 0, y: 0 }, r, { fill: 'rgba(14,183,204,0.1)', stroke: 'rgba(148,163,184,0.5)', lineWidth: 1.5 });
    e.drawCircle({ x: 0, y: 0 }, 0.045, { fill: '#94a3b8' });

    const x = r * Math.cos(this._theta);
    const y = r * Math.sin(this._theta);
    e.drawLine({ x: 0, y: 0 }, { x, y }, { stroke: 'rgba(148,163,184,0.6)', lineWidth: 2 });
    e.drawText(`r = ${r.toFixed(1)} m`, { x: x / 2, y: y / 2 + 0.14 }, { color: 'rgba(226,232,240,0.85)', font: '600 12px sans-serif' });

    // Tangential applied force vector at the rim, in the current direction of rotation
    // (or, at rest, the direction it will start spinning) — this is what generates τ.
    const spin = this._omega !== 0 ? Math.sign(this._omega) : this.force !== 0 ? Math.sign(this.force) : 1;
    const tx = -Math.sin(this._theta) * spin;
    const ty = Math.cos(this._theta) * spin;
    const fScale = 0.12;
    e.drawArrow({ x, y }, { x: x + tx * Math.abs(this.force) * fScale, y: y + ty * Math.abs(this.force) * fScale }, {
      stroke: '#e5484d',
      lineWidth: 2.5,
      headLength: 8,
    });
    e.drawText('F', { x: x + tx * Math.abs(this.force) * fScale * 1.35, y: y + ty * Math.abs(this.force) * fScale * 1.35 }, {
      color: '#e5484d',
      font: '700 15px sans-serif',
    });

    e.drawCircle({ x, y }, this._dragging ? 0.11 : 0.08, { fill: '#0eb7cc' });

    // Rotation-direction arc around the center — a curved arrow reads more
    // naturally as "spin direction" than a straight vector would.
    if (Math.abs(this._omega) > 0.02 || Math.abs(this.force) > 0.01) {
      const ctx = e.ctx;
      const dir = this._omega !== 0 ? Math.sign(this._omega) : Math.sign(this.force);
      const arcR = 0.3;
      const start = -0.6;
      const end = 0.6;
      const steps = 16;
      ctx.save();
      ctx.strokeStyle = '#38b76a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const t = start + (end - start) * (i / steps);
        const ang = dir > 0 ? t : Math.PI - t;
        const p = e.toScreen({ x: arcR * Math.cos(ang), y: arcR * Math.sin(ang) });
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      const tipAng = dir > 0 ? end : Math.PI - end;
      const tip = e.toScreen({ x: arcR * Math.cos(tipAng), y: arcR * Math.sin(tipAng) });
      const tangentAng = tipAng + (dir > 0 ? Math.PI / 2 : -Math.PI / 2);
      ctx.fillStyle = '#38b76a';
      ctx.beginPath();
      ctx.moveTo(tip.x, tip.y);
      ctx.lineTo(tip.x - 8 * Math.cos(tangentAng - Math.PI / 6), tip.y - 8 * Math.sin(tangentAng - Math.PI / 6));
      ctx.lineTo(tip.x - 8 * Math.cos(tangentAng + Math.PI / 6), tip.y - 8 * Math.sin(tangentAng + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      e.drawText('ω', { x: 0, y: arcR + 0.22 }, { color: '#38b76a', font: '700 15px sans-serif' });
    }

    this.onUpdate?.({ theta: this._theta, omega: this._omega, alpha, torque, I });
  }
}
