// Tiny i18n. Adding a language = create a dictionary file (copy en.js) and
// register it in LANGS below — nothing else.

import en from './en.js';
import de from './de.js';

export const LANGS = {
  en: { name: 'English', dict: en },
  de: { name: 'Deutsch', dict: de },
};

const STORAGE_KEY = 'tbcrco-lang';

function detectLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LANGS[saved]) return saved;
  } catch {
    /* storage unavailable — fall through */
  }
  const nav = (navigator.language || 'en').slice(0, 2);
  return LANGS[nav] ? nav : 'en';
}

let current = detectLang();

export function getLang() {
  return current;
}

export function setLang(lang) {
  if (!LANGS[lang]) return;
  current = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
}

// t('key', { param: value }) — falls back to English, then to the key itself.
export function t(key, params = {}) {
  const s = LANGS[current].dict[key] ?? LANGS.en.dict[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => (params[k] !== undefined ? params[k] : `{${k}}`));
}
