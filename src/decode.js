// Turns solver vars back into party assignments + a score breakdown.
//
// Assignment comes from the x vars. The breakdown is recomputed
// deterministically from the assignment (not read back from served vars) —
// same numbers at optimality, but also lets us report unfilled potential
// (recipients sitting in parties without a provider).

import {
  BUFFS,
  PARTY_BUFF_IDS,
  RAID_BUFF_IDS,
  buffWeightForRole,
  TOTEM_ELEMENTS,
} from './buffs.js';
import { SPECS } from './specs.js';

export function decodeAssignment(vars, roster, partyCount) {
  // The model works on spec counts (n_{spec}_{g}); expand back to concrete
  // players — same-spec players are interchangeable, so take them in roster
  // order.
  const bySpec = new Map();
  for (const pl of roster) {
    if (!bySpec.has(pl.spec)) bySpec.set(pl.spec, []);
    bySpec.get(pl.spec).push(pl);
  }
  const parties = Array.from({ length: partyCount }, () => []);
  for (const [spec, players] of bySpec) {
    let taken = 0;
    for (let g = 0; g < partyCount; g++) {
      const count = Math.round(vars[`n_${spec}_${g}`] ?? 0);
      for (let k = 0; k < count && taken < players.length; k++) {
        parties[g].push(players[taken++]);
      }
    }
  }
  return analyzeAssignment(parties, roster);
}

// Scores an explicit party layout. Also used directly for the trivial
// no-party-buffs case (any assignment is optimal).
export function analyzeAssignment(parties, roster) {
  const partyDetails = parties.map((members) => {
    const roles = members.map((pl) => SPECS[pl.spec].role);
    const provided = new Set(members.flatMap((pl) => SPECS[pl.spec].provides));
    const candidates = [];
    for (const b of PARTY_BUFF_IDS) {
      if (!provided.has(b)) continue;
      const weightSum = roles.reduce((s, r) => s + buffWeightForRole(b, r), 0);
      const servedCount = roles.filter((r) => buffWeightForRole(b, r) > 0).length;
      candidates.push({
        id: b,
        label: BUFFS[b].label,
        servedCount,
        // round away binary-float dust (0.3 + 1 → 1.3000000000000003)
        points: Math.round(weightSum * BUFFS[b].value * 100) / 100,
      });
    }

    // Totem-element exclusivity, mirroring the ILP constraints: per element,
    // continuous totems ≤ providers, total totems ≤ providers + twisters
    // (only twist-capable specs pulse Windfury on top of an aura). Greedy
    // top-points selection under these nested caps is optimal (laminar
    // matroid), so the score matches the solver's.
    const buffs = candidates.filter((c) => !BUFFS[c.id].element);
    for (const e of TOTEM_ELEMENTS) {
      const group = candidates
        .filter((c) => BUFFS[c.id].element === e)
        .sort((a, b) => b.points - a.points);
      const providerMembers = members.filter((pl) =>
        SPECS[pl.spec].provides.some((b) => BUFFS[b].element === e),
      );
      const providers = providerMembers.length;
      const twisters = providerMembers.filter((pl) => SPECS[pl.spec].twistsTotems).length;
      let continuous = 0;
      let total = 0;
      for (const c of group) {
        if (total >= providers + twisters) break;
        if (!BUFFS[c.id].twistable) {
          if (continuous >= providers) continue;
          continuous++;
        }
        total++;
        buffs.push(c);
      }
    }

    const partyScore = Math.round(buffs.reduce((s, x) => s + x.points, 0) * 100) / 100;
    // Display: a buff nobody in the party benefits from isn't really "active".
    const visible = buffs.filter((x) => x.servedCount > 0).sort((a, b) => b.points - a.points);
    return { members, buffs: visible, partyScore };
  });

  const raidBuffs = computeRaidBuffs(roster);
  const round2 = (x) => Math.round(x * 100) / 100;
  const raidScore = round2(raidBuffs.reduce((s, x) => s + x.points, 0));
  const partyScore = round2(partyDetails.reduce((s, pd) => s + pd.partyScore, 0));

  return {
    parties: partyDetails,
    raidBuffs,
    partyScore,
    raidScore,
    totalScore: round2(partyScore + raidScore),
    suggestions: buildSuggestions(partyDetails),
  };
}

// Raid-global flat bonus: same for any assignment, excluded from the ILP.
export function computeRaidBuffs(roster) {
  const raidProvided = new Set(roster.flatMap((pl) => SPECS[pl.spec].providesRaid ?? []));
  const raidBuffs = [];
  for (const b of RAID_BUFF_IDS) {
    if (!raidProvided.has(b)) continue;
    const weightSum = roster.reduce((s, pl) => s + buffWeightForRole(b, SPECS[pl.spec].role), 0);
    const servedCount = roster.filter((pl) => buffWeightForRole(b, SPECS[pl.spec].role) > 0).length;
    raidBuffs.push({
      id: b,
      label: BUFFS[b].label,
      servedCount,
      points: Math.round(weightSum * BUFFS[b].value * 100) / 100,
    });
  }
  return raidBuffs;
}

export function computeRaidScore(roster) {
  return computeRaidBuffs(roster).reduce((s, x) => s + x.points, 0);
}

// "Unfilled potential" hints, e.g. a buff serving fewer members than the
// party has room for. Returns structured data — the UI formats/translates.
function buildSuggestions(partyDetails) {
  const out = [];
  partyDetails.forEach((pd, g) => {
    for (const buff of pd.buffs) {
      if (buff.servedCount < pd.members.length && buff.servedCount <= 2) {
        out.push({
          buffId: buff.id,
          label: buff.label,
          party: g + 1,
          served: buff.servedCount,
          size: pd.members.length,
          value: BUFFS[buff.id].value,
        });
      }
    }
  });
  return out;
}
