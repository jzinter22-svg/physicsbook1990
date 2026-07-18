/*
  Chapter catalogue driving the homepage chapter-card grid and the search
  index. An entry stays `locked: true` (no `href`) until that chapter has
  been authored — Chapter 1 (mechanics) is the first to unlock.

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
    locked: false,
    href: 'chapter-1.html',
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
