import { initTheme } from './lib/theme.js';
import { initI18n, t } from './lib/i18n.js';
import { initMotion } from './lib/motion.js';
import { showToast } from './lib/toast.js';
import { DemoSimulation } from './lib/demo-simulation.js';
import './components/index.js';

initTheme();
initI18n();
initMotion();

customElements.whenDefined('sim-container').then(() => {
  const host = document.getElementById('ds-sim');
  if (!host) return;
  const simulation = new DemoSimulation(host.viewport);
  host.mount(simulation);
  simulation.start();
});

customElements.whenDefined('canvas-figure').then(() => {
  const host = document.getElementById('ds-canvas-figure');
  if (!host) return;
  host.mount(new DemoSimulation(host.viewport));
});

customElements.whenDefined('data-chart').then(() => {
  const chart = document.getElementById('ds-chart');
  if (!chart) return;
  const setSampleData = () => {
    chart.data = [
      { label: `${t('chart.categoryLabel')} A`, value: 68 },
      { label: `${t('chart.categoryLabel')} B`, value: 45 },
      { label: `${t('chart.categoryLabel')} C`, value: 82 },
      { label: `${t('chart.categoryLabel')} D`, value: 30 },
    ];
  };
  setSampleData();
  document.addEventListener('langchange', setSampleData);
});

document.getElementById('open-modal-btn')?.addEventListener('click', () => {
  document.getElementById('ds-demo-modal')?.open();
});

document.getElementById('open-dialog-btn')?.addEventListener('click', () => {
  document.getElementById('ds-demo-dialog')?.open();
});

document.getElementById('ds-demo-dialog')?.addEventListener('confirm', () => {
  showToast(t('toast.demoMessage'), { variant: 'success' });
});

document.getElementById('show-toast-btn')?.addEventListener('click', () => {
  showToast(t('toast.demoMessage'), { variant: 'success' });
});
