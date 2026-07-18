import { initTheme } from './lib/theme.js';
import { initI18n } from './lib/i18n.js';
import { initMotion } from './lib/motion.js';
import './components/index.js';

import { CircularMotionSim } from './simulations/circular-motion-sim.js';
import { KeplerOrbitSim } from './simulations/kepler-orbit-sim.js';
import { AngularMomentumSim } from './simulations/angular-momentum-sim.js';

// Theme, language, and motion preference must be applied before first paint reads them.
initTheme();
initI18n();
initMotion();

customElements.whenDefined('sim-container').then(() => {
  mountCircularMotionSim();
  mountKeplerOrbitSim();
  mountAngularMomentumSim();
});

/*
  Formula readouts re-typeset via MathJax on every `.values` write, which is
  far too expensive to do on every animation frame (~60/s) — the canvas
  itself keeps running at full frame rate regardless, only the MathJax text
  is throttled to a few updates per second, which is still plenty for a
  human to read as "live".
*/
function throttled(fn, intervalMs) {
  let last = 0;
  return (...args) => {
    const now = performance.now();
    if (now - last < intervalMs) return;
    last = now;
    fn(...args);
  };
}

function mountCircularMotionSim() {
  const host = document.getElementById('sim-circular');
  if (!host) return;

  const sim = new CircularMotionSim(host.viewport);
  host.mount(sim);

  const vDisplay = document.getElementById('cm-v');
  const acDisplay = document.getElementById('cm-ac');
  const fcDisplay = document.getElementById('cm-fc');
  const formula = document.getElementById('cm-formula');
  const radiusSlider = document.getElementById('cm-radius');
  const omegaSlider = document.getElementById('cm-omega');
  formula?.setAttribute('template', 'a_{c} = \\omega^{2} r = ({omega})^{2} \\times {r} \\approx {ac}\\ \\text{m/s}^{2}');

  const updateFormula = throttled((omega, r, ac) => {
    if (formula) formula.values = { omega: omega.toFixed(1), r: r.toFixed(1), ac: ac.toFixed(2) };
  }, 200);

  sim.onUpdate = ({ v, ac, fc, r, omega }) => {
    if (vDisplay) vDisplay.value = v;
    if (acDisplay) acDisplay.value = ac;
    if (fcDisplay) fcDisplay.value = fc;
    updateFormula(omega, r, ac);
  };

  radiusSlider?.addEventListener('sim-change', (event) => sim.setRadius(event.detail.value));
  omegaSlider?.addEventListener('sim-change', (event) => sim.setOmega(event.detail.value));
  document.getElementById('cm-mass')?.addEventListener('sim-change', (event) => sim.setMass(event.detail.value));
  document.getElementById('cm-speed')?.addEventListener('sim-speed-change', (event) => sim.setSpeed(event.detail.value));

  sim.start();
}

function mountKeplerOrbitSim() {
  const host = document.getElementById('sim-kepler');
  if (!host) return;

  const sim = new KeplerOrbitSim(host.viewport);
  host.mount(sim);

  const rDisplay = document.getElementById('kp-r');
  const thetaDotDisplay = document.getElementById('kp-thetadot');
  const formula = document.getElementById('kp-formula');
  formula?.setAttribute('template', '\\frac{dA}{dt} = \\tfrac{1}{2} r^{2}\\dot\\theta \\approx {areal}\\ \\text{(constant)}');

  const updateFormula = throttled((areal) => {
    if (formula) formula.values = { areal: areal.toFixed(3) };
  }, 200);

  sim.onUpdate = ({ r, thetaDot }) => {
    if (rDisplay) rDisplay.value = r;
    if (thetaDotDisplay) thetaDotDisplay.value = thetaDot;
    // dA/dt = 1/2 r^2 * dtheta/dt stays constant across the whole orbit —
    // showing it update live (and stay put) is the numeric face of Kepler's
    // second law, not just the visual swept-area sector.
    updateFormula(0.5 * r * r * thetaDot);
  };

  document.getElementById('kp-ecc')?.addEventListener('sim-change', (event) => sim.setEccentricity(event.detail.value));
  document.getElementById('kp-speed')?.addEventListener('sim-speed-change', (event) => sim.setSpeed(event.detail.value));

  sim.start();
}

function mountAngularMomentumSim() {
  const host = document.getElementById('sim-angmom');
  if (!host) return;

  const sim = new AngularMomentumSim(host.viewport);
  host.mount(sim);

  const iDisplay = document.getElementById('am-I');
  const omegaDisplay = document.getElementById('am-omega');
  const lDisplay = document.getElementById('am-L');
  const keDisplay = document.getElementById('am-ke');
  const formula = document.getElementById('am-formula');
  const radiusSlider = document.getElementById('am-radius');
  formula?.setAttribute('template', 'L = I\\omega = {I} \\times {omega} \\approx {L}\\ \\text{kg·m}^{2}/\\text{s}');

  const updateFormula = throttled((I, omega, L) => {
    if (formula) formula.values = { I: I.toFixed(2), omega: omega.toFixed(2), L: L.toFixed(2) };
  }, 200);

  sim.onUpdate = ({ I, omega, L, ke, r }) => {
    if (iDisplay) iDisplay.value = I;
    if (omegaDisplay) omegaDisplay.value = omega;
    if (lDisplay) lDisplay.value = L;
    if (keDisplay) keDisplay.value = ke;
    // Keep the slider thumb following the drag, so grabbing a mass on the
    // canvas and dragging the sim-slider are two views of the same state.
    if (radiusSlider) radiusSlider.value = r;
    updateFormula(I, omega, L);
  };

  radiusSlider?.addEventListener('sim-change', (event) => sim.setRadius(event.detail.value));
  document.getElementById('am-speed')?.addEventListener('sim-speed-change', (event) => sim.setSpeed(event.detail.value));

  sim.start();
}
