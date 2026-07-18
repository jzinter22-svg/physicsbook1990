import { initTheme } from './lib/theme.js';
import { initI18n, t } from './lib/i18n.js';
import { initMotion } from './lib/motion.js';
import { CHAPTERS } from './data/chapters.js';
import { icon } from './components/icons.js';
import './components/index.js';

// Theme, language, and motion preference must be applied before first paint reads them.
initTheme();
initI18n();
initMotion();

const HERO_FEATURES = [
  ['feature-animations', 'wave', 'hero.feature.animations'],
  ['feature-exercises', 'pencil', 'hero.feature.exercises'],
  ['feature-explanations', 'book', 'hero.feature.explanations'],
  ['feature-simulations', 'atom', 'hero.feature.simulations'],
];

function renderHeroFeatures() {
  HERO_FEATURES.forEach(([id, iconName, key]) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `${icon(iconName)}<span>${t(key)}</span>`;
  });
}

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
renderHeroFeatures();
document.addEventListener('langchange', renderHeroFeatures);
