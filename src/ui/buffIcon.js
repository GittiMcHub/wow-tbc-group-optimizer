// Buff icon <img> from the bundled Wowhead icon pack
// (wow.zamimg.com, 36px "medium" size), files named by our buff ids.
// Vite resolves the dynamic `new URL(...)` pattern at build time.
//
// Names and tooltip texts come from i18n (`buff.<id>.name` / `.tooltip`),
// resolved at render time — so a language switch re-translates existing
// results without a re-solve.

import { t } from '../i18n/index.js';

export function buffIconHtml(buffId) {
  const url = new URL(`../assets/buffs/${buffId}.jpg`, import.meta.url).href;
  return `<img class="buff-icon" src="${url}" alt="" />`;
}

export function buffName(buffId) {
  return t(`buff.${buffId}.name`);
}

// Icon + localized label wrapped with a WoW-style hover tooltip showing the
// in-game ability/talent text.
export function buffLabelHtml(buffId) {
  const tooltip =
    `<span class="game-tooltip"><span class="gt-title">${buffName(buffId)}</span>` +
    `<span class="gt-desc">${t(`buff.${buffId}.tooltip`)}</span></span>`;
  return (
    `<span class="buff-name tooltip-wrap">` +
    buffIconHtml(buffId) +
    `<span class="buff-label">${buffName(buffId)}</span>` +
    tooltip +
    `</span>`
  );
}
