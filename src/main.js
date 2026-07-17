import { initTheme } from './lib/theme.js';
import { initI18n } from './lib/i18n.js';
import { DemoSimulation } from './lib/demo-simulation.js';
import './components/index.js';

// Theme and language must be applied before first paint reads them.
initTheme();
initI18n();

// Wire the homepage tech-demo simulation once <sim-container> has upgraded.
customElements.whenDefined('sim-container').then(() => {
  const host = document.getElementById('hero-sim');
  if (!host) return;
  const simulation = new DemoSimulation(host.viewport);
  host.mount(simulation);
  simulation.start();
});
