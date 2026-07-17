import { initTheme } from './lib/theme.js';
import { initI18n } from './lib/i18n.js';
import { initMotion } from './lib/motion.js';
import { CHAPTERS } from './data/chapters.js';
import { computeStats } from './lib/progress.js';
import './components/index.js';

// Theme, language, and motion preference must be applied before first paint reads them.
initTheme();
initI18n();
initMotion();

function renderChapterGrid() {
  const grid = document.getElementById('chapters-grid');
  if (!grid) return;

  const cards = CHAPTERS.map(
    (chapter) => `
      <chapter-card
        id="chapter-${chapter.id}"
        domain="${chapter.domain}"
        icon="${chapter.icon}"
        title-key="${chapter.titleKey}"
        desc-key="${chapter.descKey}"
        ${chapter.locked ? 'locked' : ''}
        ${!chapter.locked && chapter.href ? `href="${chapter.href}"` : ''}
      ></chapter-card>
    `
  ).join('');

  const moreCard = `
    <chapter-card icon="spark" title-key="chapters.more.title" desc-key="chapters.more.desc" locked></chapter-card>
  `;

  grid.innerHTML = cards + moreCard;
}

function renderProgress() {
  const stats = computeStats(CHAPTERS);

  document.getElementById('overall-progress')?.setAttribute('value', String(stats.percent));
  document.getElementById('stat-available')?.setAttribute('value', String(stats.total));
  document.getElementById('stat-completed')?.setAttribute('value', String(stats.completed));
  document.getElementById('stat-percent')?.setAttribute('value', `${stats.percent}%`);
}

renderChapterGrid();
renderProgress();
