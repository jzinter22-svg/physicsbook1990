/*
  Shared line-icon set: 24x24 viewBox, stroke=currentColor, consistent weight.
  Centralized so every component draws icons from one place instead of mixing
  emoji, third-party icon fonts, and one-off inline SVG.
*/

const WRAP_START = (extra = '') =>
  `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>`;
const WRAP_END = '</svg>';

const PATHS = {
  atom: `<ellipse cx="12" cy="12" rx="9" ry="3.6"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(120 12 12)"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/>`,
  bolt: `<path d="M12 2 4 14h6l-1 8 9-13h-6l1-7z"/>`,
  wave: `<path d="M2 12c1.5-4 3.5-4 5 0s3.5 4 5 0 3.5-4 5 0 3.5 4 5 0"/>`,
  thermometer: `<path d="M12 14.5V4a2 2 0 1 0-4 0v10.5a4 4 0 1 0 4 0Z"/><path d="M12 8h-2"/>`,
  flask: `<path d="M9 2h6"/><path d="M10 2v6.2L4.5 18a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14 8.2V2"/><path d="M7 15h10"/>`,
  lock: `<rect x="4.5" y="10.5" width="15" height="9.5" rx="2"/><path d="M8 10.5V7a4 4 0 1 1 8 0v3.5"/>`,
  search: `<circle cx="11" cy="11" r="7"/><path d="m20 20-3.4-3.4"/>`,
  sun: `<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6"/>`,
  moon: `<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/>`,
  gear: `<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.4M12 18.8v2.4M4.3 7l2 1.2M17.7 15.8l2 1.2M4.3 17l2-1.2M17.7 8.2l2-1.2M2.8 12h2.4M18.8 12h2.4"/>`,
  home: `<path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9a1 1 0 0 0 1 1h4v-6h2v6h4a1 1 0 0 0 1-1v-9"/>`,
  chart: `<path d="M4 20V10M10 20V4M16 20v-7M4 20h16"/>`,
  menu: `<path d="M4 6.5h16M4 12h16M4 17.5h16"/>`,
  close: `<path d="m5 5 14 14M19 5 5 19"/>`,
  globe: `<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.3 3.7 5.2 3.7 8.5s-1.3 6.2-3.7 8.5c-2.4-2.3-3.7-5.2-3.7-8.5S9.6 5.8 12 3.5Z"/>`,
  chevronDown: `<path d="m6 9 6 6 6-6"/>`,
  spark: `<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.8 2.8M15.2 15.2 18 18M18 6l-2.8 2.8M8.8 15.2 6 18"/>`,
  play: `<path d="m8 5 12 7-12 7Z"/>`,
  pause: `<path d="M7 5h3v14H7zM14 5h3v14h-3z"/>`,
  reset: `<path d="M4 4v6h6"/><path d="M4.5 13a8 8 0 1 0 2-8.5L4 10"/>`,
  compass: `<circle cx="12" cy="12" r="9"/><path d="m14.8 9.2-1.6 4.4-4.4 1.6 1.6-4.4z"/>`,
  beaker: `<path d="M9 3h6M10 3v6.5L4.9 18a1.8 1.8 0 0 0 1.55 2.7h11.1A1.8 1.8 0 0 0 19.1 18L14 9.5V3"/><path d="M7.5 14.5h9"/>`,

  book: `<path d="M5 4.5A2 2 0 0 1 7 3h9.5a1 1 0 0 1 1 1v14.5a1 1 0 0 1-1 1H7a2 2 0 0 0-2 2Z"/><path d="M5 4.5V19a2 2 0 0 0 2 2h10.5"/>`,
  bulb: `<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.45 1 1.15 1 1.9V16h5v-.2c0-.75.4-1.45 1-1.9A6 6 0 0 0 12 3Z"/>`,
  pencil: `<path d="m4 20 1-4.2L15.5 5.3a1.5 1.5 0 0 1 2.1 0l1.1 1.1a1.5 1.5 0 0 1 0 2.1L8.2 19 4 20Z"/><path d="m14 6.5 3.5 3.5"/>`,
  sigma: `<path d="M17 4H6l6 8-6 8h11"/>`,
  info: `<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><circle cx="12" cy="8" r="0.9" fill="currentColor" stroke="none"/>`,
  alertTriangle: `<path d="M12 3.5 2.5 20h19Z"/><path d="M12 9.5v4.5"/><circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none"/>`,
  monitor: `<rect x="3" y="4.5" width="18" height="12" rx="1.5"/><path d="M9 20.5h6M12 16.5v4"/>`,
  target: `<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none"/>`,
  listCheck: `<path d="m4 6 1.5 1.5L8 5"/><path d="M11 6h9"/><path d="m4 12 1.5 1.5L8 11"/><path d="M11 12h9"/><path d="m4 18 1.5 1.5L8 17"/><path d="M11 18h9"/>`,
  tree: `<circle cx="12" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="19" r="2"/><path d="M12 7v5m0 0-6 5m6-5 6 5"/>`,
  bookOpen: `<path d="M12 6.5c-1.2-1-3-1.5-5.5-1.5S3 5.5 3 6.5v12c1-.7 2.5-1 4.5-1s3.6.4 4.5 1c.9-.6 2.5-1 4.5-1s3.5.3 4.5 1v-12c0-1-1-1.5-3.5-1.5S13.2 5.5 12 6.5Z"/><path d="M12 6.5V19"/>`,
  chevronLeft: `<path d="m15 6-6 6 6 6"/>`,
  chevronRight: `<path d="m9 6 6 6-6 6"/>`,
  dragHandle: `<circle cx="9" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1" fill="currentColor" stroke="none"/>`,
  expand: `<path d="M9 3H3v6M15 3h6v6M9 21H3v-6M15 21h6v-6"/>`,
  image: `<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="m21 15-5-5-4.5 4.5M12 16l-2.5-2.5L3 19"/>`,
  table: `<rect x="3" y="4.5" width="18" height="15" rx="1.5"/><path d="M3 9.5h18M3 14.5h18M9 4.5v15M15 4.5v15"/>`,
  checkCircle: `<circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.5 2.5L16 9.5"/>`,
  xCircle: `<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6m0-6-6 6"/>`,
};

/**
 * @param {keyof typeof PATHS} name
 * @param {{ class?: string }} [opts]
 */
export function icon(name, opts = {}) {
  const path = PATHS[name];
  if (!path) throw new Error(`Unknown icon: ${name}`);
  const extra = opts.class ? `class="${opts.class}"` : '';
  return `${WRAP_START(extra)}${path}${WRAP_END}`;
}

export const ICON_NAMES = Object.keys(PATHS);
