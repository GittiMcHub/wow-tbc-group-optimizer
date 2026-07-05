// Score breakdown: total, party-local vs raid-global split, raid buff list,
// "unfilled potential" suggestions, and recruit rankings for open slots.

import { specIconHtml } from './specIcon.js';
import { buffLabelHtml, buffName } from './buffIcon.js';
import { fmt } from './fmt.js';
import { t } from '../i18n/index.js';

export function renderScorePanel(result) {
  const panel = document.createElement('div');
  panel.className = 'score-panel';

  panel.innerHTML =
    `<h2>${t('score.title')}</h2>` +
    `<p class="total-score">${fmt(result.totalScore)} <span class="muted">${t('score.pts')}</span></p>` +
    `<p class="muted">${t('score.split', { party: fmt(result.partyScore), raid: fmt(result.raidScore) })}</p>`;

  if (result.raidBuffs.length > 0) {
    const h = document.createElement('h4');
    h.textContent = t('score.raidBuffs');
    panel.appendChild(h);
    const ul = document.createElement('ul');
    ul.className = 'raid-buffs';
    for (const buff of result.raidBuffs) {
      const li = document.createElement('li');
      li.innerHTML = `${buffLabelHtml(buff.id)}<span class="muted">→ ${buff.servedCount} · +${fmt(buff.points)}</span>`;
      ul.appendChild(li);
    }
    panel.appendChild(ul);
  }

  if (result.suggestions.length > 0) {
    const h = document.createElement('h4');
    h.textContent = t('score.potential');
    panel.appendChild(h);
    const ul = document.createElement('ul');
    ul.className = 'suggestions';
    for (const s of result.suggestions) {
      const li = document.createElement('li');
      li.textContent = t('score.suggestion', {
        buff: buffName(s.buffId),
        party: s.party,
        served: s.served,
        size: s.size,
        value: s.value,
      });
      ul.appendChild(li);
    }
    panel.appendChild(ul);
  }

  if (result.recruits?.length > 0) {
    const h = document.createElement('h4');
    h.textContent = t('score.recruits', { count: result.missingSlots });
    panel.appendChild(h);
    const ul = document.createElement('ul');
    ul.className = 'recruits';
    for (const rec of result.recruits.filter((r) => r.totalGain > 0).slice(0, 10)) {
      const li = document.createElement('li');
      const detail =
        rec.raidGain > 0 ? ' ' + t('score.gainDetail', { party: fmt(rec.partyGain), raid: fmt(rec.raidGain) }) : '';
      li.innerHTML =
        specIconHtml(rec.spec) +
        `<span class="recruit-label">${rec.label}</span>` +
        `<span class="recruit-gain">+${fmt(rec.totalGain)}<span class="muted small">${detail}</span></span>`;
      ul.appendChild(li);
    }
    panel.appendChild(ul);
    const note = document.createElement('p');
    note.className = 'muted small';
    note.textContent = t('score.recruitNote');
    panel.appendChild(note);
  }

  return panel;
}
