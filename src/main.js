import { initTheme } from './lib/theme.js';
import { initI18n } from './lib/i18n.js';
import { initMotion } from './lib/motion.js';
import { CHAPTERS } from './data/chapters.js';
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

renderChapterGrid();
