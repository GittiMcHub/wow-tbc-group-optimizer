// Recruitment suggestions: with 1-4 open raid slots, rank every spec by the
// total score gain of adding one such player, computed by re-solving the ILP
// with a ghost player.
//
// Cost control: specs with identical (role, provides) are interchangeable for
// the party-local solve, so we solve once per equivalence class (~11 solves
// instead of 26). Raid-global contribution differs per spec (e.g. only a
// Fury/Arms warrior brings Battle Shout) and is added per spec afterwards —
// it needs no solve, just the flat-bonus delta.

import { SPECS, SPEC_IDS } from './specs.js';
import { buildModel } from './model.js';
import { decodeAssignment, computeRaidScore } from './decode.js';

// Group all specs by party-solve equivalence.
function equivalenceClasses() {
  const groups = new Map();
  for (const s of SPEC_IDS) {
    const key = `${SPECS[s].role}|${[...SPECS[s].provides].sort().join(',')}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  }
  return [...groups.values()];
}

// Advisory solve, tuned for speed over proof of optimality:
// - lower-bound constraint objective ≥ basePartyScore (valid: the current
//   layout plus the ghost in any open slot stays feasible, so the optimum
//   can't drop) — prunes most of the branch & bound tree;
// - mipgap 1% + tmlim 2s: benchmarks show the true optimum is found well
//   within these limits even on hard instances; the cap only cuts short the
//   optimality *proof*, which these numbers don't need.
async function solvePartyScore(glpk, roster, partyCount, basePartyScore) {
  const lp = buildModel(roster, partyCount, glpk);
  if (basePartyScore > 0) {
    lp.subjectTo.push({
      name: 'lb_obj',
      vars: lp.objective.vars.map((v) => ({ name: v.name, coef: v.coef })),
      bnds: { type: glpk.GLP_LO, lb: basePartyScore, ub: 0 },
    });
  }
  const res = await glpk.solve(lp, { msglev: glpk.GLP_MSG_ERR, mipgap: 0.01, tmlim: 1 });
  return decodeAssignment(res.result.vars, roster, partyCount).partyScore;
}

// → [{ spec, label, partyGain, raidGain, totalGain }] sorted by totalGain
// desc. onProgress(done, total) fires after each equivalence-class solve.
export async function computeRecruits(glpk, roster, partyCount, basePartyScore, onProgress) {
  const baseRaidScore = computeRaidScore(roster);
  const classes = equivalenceClasses();
  const results = [];

  let done = 0;
  for (const specGroup of classes) {
    const ghost = { id: '__ghost__', spec: specGroup[0], name: '' };
    const withGhost = [...roster, ghost];
    const partyGain =
      (await solvePartyScore(glpk, withGhost, partyCount, basePartyScore)) - basePartyScore;
    onProgress?.(++done, classes.length);

    for (const spec of specGroup) {
      const round2 = (x) => Math.round(x * 100) / 100;
      const raidGain = round2(
        computeRaidScore([...roster, { id: '__ghost__', spec, name: '' }]) - baseRaidScore,
      );
      results.push({
        spec,
        label: SPECS[spec].label,
        partyGain: round2(partyGain),
        raidGain,
        totalGain: round2(partyGain + raidGain),
      });
    }
  }

  results.sort((a, b) => b.totalGain - a.totalGain || a.label.localeCompare(b.label));
  return results;
}
