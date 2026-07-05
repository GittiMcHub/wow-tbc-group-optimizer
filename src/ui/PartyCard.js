// One card per party: members + active party buffs with served counts.

import { SPECS } from '../specs.js';
import { specIconHtml } from './specIcon.js';
import { buffLabelHtml } from './buffIcon.js';
import { fmt } from './fmt.js';
import { t } from '../i18n/index.js';

export function renderPartyCard(party, index) {
  const card = document.createElement('div');
  card.className = 'party-card';

  const h = document.createElement('h3');
  h.innerHTML = `${t('party.title', { n: index + 1 })} <span class="muted">${fmt(party.partyScore)} ${t('party.pts')}</span>`;
  card.appendChild(h);

  const members = document.createElement('ul');
  members.className = 'party-members';
  for (const pl of party.members) {
    const spec = SPECS[pl.spec];
    const li = document.createElement('li');
    li.innerHTML =
      specIconHtml(pl.spec) +
      `<span class="player-name">${escapeHtml(pl.name || spec.label)}</span>` +
      `<span class="role-tag role-${spec.role}">${t('role.' + spec.role)}</span>`;
    members.appendChild(li);
  }
  card.appendChild(members);

  if (party.buffs.length > 0) {
    const buffs = document.createElement('ul');
    buffs.className = 'party-buffs';
    for (const buff of party.buffs) {
      const li = document.createElement('li');
      li.innerHTML =
        buffLabelHtml(buff.id) +
        `<span class="muted">→ ${buff.servedCount} · +${fmt(buff.points)}</span>`;
      buffs.appendChild(li);
    }
    card.appendChild(buffs);
  } else {
    const none = document.createElement('p');
    none.className = 'muted small';
    none.textContent = t('party.noBuffs');
    card.appendChild(none);
  }

  return card;
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
