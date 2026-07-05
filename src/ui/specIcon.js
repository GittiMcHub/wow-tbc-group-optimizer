// Spec icon <img> from the bundled emoji pack
// (https://github.com/danetch/wowspecsemojis), files named by our spec ids.
// Vite resolves the dynamic `new URL(...)` pattern at build time.

import { SPECS } from '../specs.js';

export function specIconHtml(specId) {
  const url = new URL(`../assets/specs/${specId}.png`, import.meta.url).href;
  return `<img class="spec-icon" src="${url}" alt="" title="${SPECS[specId].label}" />`;
}
