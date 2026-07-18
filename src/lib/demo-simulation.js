import { Simulation } from './simulation.js';

/*
  Foundation tech-demo only — an oscilloscope-style sweep used to verify the
  Simulation base class (resize, animation loop, play/pause/reset). This is
  deliberately generic chrome, not Chapter 1 physics content.
*/
export class DemoSimulation extends Simulation {
  onReset() {
    this._t = 0;
  }

  onResize() {
    if (this._t === undefined) this._t = 0;
  }

  update(dt) {
    this._t += dt;
  }

  render(ctx) {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    const t = this._t ?? 0;

    ctx.clearRect(0, 0, width, height);

    const styles = getComputedStyle(this.host);
    const gridColor = styles.getPropertyValue('--color-bg-grid-line').trim() || 'rgba(255,255,255,0.1)';
    const traceColor = styles.getPropertyValue('--color-primary').trim() || '#0eb7cc';

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    const step = 24;
    for (let x = 0; x <= width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.strokeStyle = traceColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const amplitude = height * 0.28;
    const midY = height / 2;
    for (let x = 0; x <= width; x += 2) {
      const phase = (x / width) * Math.PI * 4 - t * 2.4;
      const y = midY + Math.sin(phase) * amplitude;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}
