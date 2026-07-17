import { CanvasEngine } from '../engine/canvas-engine.js';
import { SimulationEngine } from '../engine/simulation-engine.js';
import { centripetalAcceleration, centripetalForce } from '../engine/physics/rotation.js';

/*
  Interactive counterpart to Figures (1-1)/(2-1)/(3-1): a particle in
  uniform circular motion, with its tangential velocity (green, solid) and
  centripetal acceleration (red, dashed) vectors redrawn live as radius,
  angular velocity, or mass change. Vectors are also distinguished by line
  style (not just color) and labeled with text, per the project's
  never-color-alone rule.
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
    /** @type {((values: { v: number, ac: number, fc: number }) => void) | null} */
    this.onUpdate = null;

    this.sim = new SimulationEngine({
      step: (dt) => {
        this._theta += this.omega * dt;
      },
      render: () => this._render(),
      reset: () => {
        this._theta = 0;
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
    e.drawCircle({ x, y }, 0.08, { fill: '#0eb7cc' });
    e.drawText('v', { x: x + tx * v * vScale * 1.3, y: y + ty * v * vScale * 1.3 }, { color: '#38b76a', font: '700 15px sans-serif' });
    e.drawText('aᴄ', { x: x + ux * ac * aScale * 1.35, y: y + uy * ac * aScale * 1.35 }, { color: '#e5484d', font: '700 15px sans-serif' });

    this.onUpdate?.({ v, ac, fc });
  }
}
