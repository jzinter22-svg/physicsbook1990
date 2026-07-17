/*
  Placeholder chapter catalogue — category names only, no lesson content.
  Drives the homepage chapter-card grid and the search index. Every entry is
  `locked: true` until real chapter authoring starts.

  Domain/icon/color pairing intentionally stays within the 4-hue categorical
  set validated in tokens.css (see the comment there before adding a 5th).
*/
export const CHAPTERS = [
  {
    id: 'mechanics',
    domain: 'mechanics',
    icon: 'compass',
    titleKey: 'chapters.mechanics.title',
    descKey: 'chapters.mechanics.desc',
    locked: true,
  },
  {
    id: 'thermo',
    domain: 'thermo',
    icon: 'thermometer',
    titleKey: 'chapters.thermo.title',
    descKey: 'chapters.thermo.desc',
    locked: true,
  },
  {
    id: 'waves',
    domain: 'waves',
    icon: 'wave',
    titleKey: 'chapters.waves.title',
    descKey: 'chapters.waves.desc',
    locked: true,
  },
  {
    id: 'electromag',
    domain: 'electromag',
    icon: 'bolt',
    titleKey: 'chapters.electromag.title',
    descKey: 'chapters.electromag.desc',
    locked: true,
  },
];
