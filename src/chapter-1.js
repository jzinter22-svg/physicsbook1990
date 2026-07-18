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

function mountCircularMotionSim() {
  const host = document.getElementById('sim-circular');
  if (!host) return;

  const sim = new CircularMotionSim(host.viewport);
  host.mount(sim);

  const vDisplay = document.getElementById('cm-v');
  const acDisplay = document.getElementById('cm-ac');
  const fcDisplay = document.getElementById('cm-fc');
  sim.onUpdate = ({ v, ac, fc }) => {
    if (vDisplay) vDisplay.value = v;
    if (acDisplay) acDisplay.value = ac;
    if (fcDisplay) fcDisplay.value = fc;
  };

  document.getElementById('cm-radius')?.addEventListener('sim-change', (event) => sim.setRadius(event.detail.value));
  document.getElementById('cm-omega')?.addEventListener('sim-change', (event) => sim.setOmega(event.detail.value));
  document.getElementById('cm-mass')?.addEventListener('sim-change', (event) => sim.setMass(event.detail.value));

  sim.start();
}

function mountKeplerOrbitSim() {
  const host = document.getElementById('sim-kepler');
  if (!host) return;

  const sim = new KeplerOrbitSim(host.viewport);
  host.mount(sim);

  const rDisplay = document.getElementById('kp-r');
  const thetaDotDisplay = document.getElementById('kp-thetadot');
  sim.onUpdate = ({ r, thetaDot }) => {
    if (rDisplay) rDisplay.value = r;
    if (thetaDotDisplay) thetaDotDisplay.value = thetaDot;
  };

  document.getElementById('kp-ecc')?.addEventListener('sim-change', (event) => sim.setEccentricity(event.detail.value));

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
  sim.onUpdate = ({ I, omega, L, ke }) => {
    if (iDisplay) iDisplay.value = I;
    if (omegaDisplay) omegaDisplay.value = omega;
    if (lDisplay) lDisplay.value = L;
    if (keDisplay) keDisplay.value = ke;
  };

  document.getElementById('am-radius')?.addEventListener('sim-change', (event) => sim.setRadius(event.detail.value));

  sim.start();
}
