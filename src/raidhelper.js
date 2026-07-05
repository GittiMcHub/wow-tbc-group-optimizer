// Raid-Helper (raid-helper.xyz) import.
//
// An event page like https://raid-helper.xyz/event/<id> exposes JSON at
// https://raid-helper.xyz/api/v4/events/<id>. The API sends
// Access-Control-Allow-Origin: *, so direct fetch works; JSON paste is
// offered as a fallback anyway (proxies/offline/copied exports).
//
// Sign-ups carry className/specName (e.g. "Shaman"/"Restoration1"). Meta
// classes like "Tank" hide the real class — spec name disambiguates
// (Protection = warrior, Protection1 = paladin, per Raid-Helper's TBC
// template). Non-player entries (Absence, Bench, ...) are skipped.

import { SPECS } from './specs.js';

const NON_PLAYER_CLASSES = new Set(['Absence', 'Bench', 'Late', 'Tentative']);

// className → specName → our spec id
const RH_SPEC_MAP = {
  Druid: {
    Balance: 'balance_druid',
    Feral: 'feral_druid',
    Guardian: 'feral_bear',
    Bear: 'feral_bear',
    Restoration: 'resto_druid',
  },
  Hunter: {
    Beastmastery: 'bm_hunter',
    Marksmanship: 'mm_hunter',
    Survival: 'surv_hunter',
  },
  Mage: {
    Arcane: 'arcane_mage',
    Fire: 'fire_mage',
    Frost: 'frost_mage',
  },
  Paladin: {
    Holy: 'holy_paladin',
    Protection: 'prot_paladin',
    Retribution: 'ret_paladin',
  },
  Priest: {
    Discipline: 'disc_priest',
    Holy: 'holy_priest',
    Shadow: 'shadow_priest',
  },
  Rogue: {
    Assassination: 'rogue',
    Combat: 'rogue',
    Subtlety: 'rogue',
  },
  Shaman: {
    Elemental: 'ele_shaman',
    Enhancement: 'enh_shaman',
    Restoration: 'resto_shaman',
    Restoration1: 'resto_shaman',
  },
  Warlock: {
    Affliction: 'affli_warlock',
    Demonology: 'demo_warlock',
    Destruction: 'destro_warlock',
  },
  Warrior: {
    Arms: 'arms_warrior',
    Fury: 'fury_warrior',
    Protection: 'prot_warrior',
  },
  // Raid-Helper meta classes — spec name identifies the actual class.
  Tank: {
    Protection: 'prot_warrior',
    Protection1: 'prot_paladin',
    Feral: 'feral_bear',
    Guardian: 'feral_bear',
    Bear: 'feral_bear',
  },
};

// Accepts a full event URL, an API URL, or a bare event id.
export function parseEventId(input) {
  const s = input.trim();
  if (/^\d{15,22}$/.test(s)) return s;
  const m = s.match(/raid-helper\.xyz\/(?:event|api\/v4\/events)\/(\d+)/i);
  return m ? m[1] : null;
}

export async function fetchRaidHelperEvent(eventId) {
  const res = await fetch(`https://raid-helper.xyz/api/v4/events/${eventId}`);
  if (!res.ok) throw new Error(`Raid-Helper API returned ${res.status}`);
  return res.json();
}

// Event JSON → { roster, skipped, title }. Never throws on individual
// sign-ups — unmappable ones land in `skipped` with a reason.
export function mapRaidHelperEvent(data) {
  const signUps = data?.signUps ?? data?.signups;
  if (!Array.isArray(signUps)) {
    throw new Error('Not a Raid-Helper event: missing signUps array');
  }
  const roster = [];
  const skipped = [];
  let i = 0;
  for (const su of signUps) {
    const cls = su.className ?? '';
    const name = su.name ?? '?';
    if (NON_PLAYER_CLASSES.has(cls)) {
      skipped.push(`${name} (${cls})`);
      continue;
    }
    if (su.status && su.status !== 'primary') {
      skipped.push(`${name} (${su.status})`);
      continue;
    }
    const spec = RH_SPEC_MAP[cls]?.[su.specName ?? ''];
    if (!spec || !SPECS[spec]) {
      skipped.push(`${name} (${cls}/${su.specName ?? 'no spec'} unmapped)`);
      continue;
    }
    roster.push({ id: `rh${Date.now()}_${i++}`, spec, name });
  }
  return { roster, skipped, title: data.title ?? '' };
}
