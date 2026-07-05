// Builds the glpk.js MILP from a roster (README §4/§5), reformulated over
// spec COUNTS instead of individual players.
//
// Why: the naive per-player binary model (x[p][g]) explodes at 24-25 players —
// players of the same spec and the parties themselves are interchangeable, so
// branch & bound wastes minutes proving optimality across thousands of
// symmetric equivalents. Since names are cosmetic, aggregate:
//
//   n_{s}_{g}      integer ≥ 0: how many players of spec s sit in party g
//   prov_{b}_{g}   binary: party-buff b is provided in party g
//   served_{b}_{g} integer: recipients of b served in party g
//                  (≤ recipient count in g, ≤ 5·prov — linearizes the
//                   provider×recipient product without per-player vars)
//
// decode.js expands counts back to concrete players. NOTE: a future
// "lock player X to party Y" feature needs per-player vars again for the
// locked players (hybrid model) — locks can't be expressed on counts alone.
//
// Raid-global buffs never enter the model — they're constant for any
// assignment and only shown as a flat score bonus (computed in decode.js).

import { BUFFS, PARTY_BUFF_IDS, buffWeightForRole, TOTEM_ELEMENTS } from './buffs.js';
import { SPECS } from './specs.js';

export const PARTY_SIZE = 5;

// roster → Map spec id → player count
export function specCounts(roster) {
  const counts = new Map();
  for (const pl of roster) counts.set(pl.spec, (counts.get(pl.spec) ?? 0) + 1);
  return counts;
}

export function buildModel(roster, partyCount, glpk) {
  const counts = specCounts(roster);
  const specIds = [...counts.keys()];
  const parties = [...Array(partyCount).keys()];

  const objectiveVars = [];
  const subjectTo = [];
  const generals = [];
  const binaries = [];
  const bounds = [];

  const nName = (s, g) => `n_${s}_${g}`;
  const provName = (b, g) => `prov_${b}_${g}`;
  const servedName = (b, g) => `served_${b}_${g}`;

  // Only model party buffs with ≥1 provider AND ≥1 recipient in this roster.
  const activeBuffs = PARTY_BUFF_IDS.filter((b) => {
    const hasProvider = specIds.some((s) => SPECS[s].provides.includes(b));
    const hasRecipient = specIds.some((s) => buffWeightForRole(b, SPECS[s].role) > 0);
    return hasProvider && hasRecipient;
  });

  // n vars + constraint 1: every player of each spec is placed somewhere.
  for (const s of specIds) {
    for (const g of parties) {
      generals.push(nName(s, g));
      bounds.push({ name: nName(s, g), type: glpk.GLP_DB, lb: 0, ub: counts.get(s) });
    }
    subjectTo.push({
      name: `place_${s}`,
      vars: parties.map((g) => ({ name: nName(s, g), coef: 1 })),
      bnds: { type: glpk.GLP_FX, ub: counts.get(s), lb: counts.get(s) },
    });
  }

  // constraint 2: party size cap (≤ 5 — allows under-full rosters).
  for (const g of parties) {
    subjectTo.push({
      name: `cap_${g}`,
      vars: specIds.map((s) => ({ name: nName(s, g), coef: 1 })),
      bnds: { type: glpk.GLP_UP, ub: PARTY_SIZE, lb: 0 },
    });
  }

  for (const b of activeBuffs) {
    const providerSpecs = specIds.filter((s) => SPECS[s].provides.includes(b));
    const recipientSpecs = specIds
      .map((s) => ({ s, w: buffWeightForRole(b, SPECS[s].role) }))
      .filter(({ w }) => w > 0);
    // Tightest valid gate for served ≤ M·prov.
    const maxW = Math.max(...recipientSpecs.map(({ w }) => w));

    for (const g of parties) {
      // constraint 3: prov_{b}_{g} ≤ Σ_{s provides b} n_{s}_{g}
      binaries.push(provName(b, g));
      subjectTo.push({
        name: `link_prov_${b}_${g}`,
        vars: [
          { name: provName(b, g), coef: 1 },
          ...providerSpecs.map((s) => ({ name: nName(s, g), coef: -1 })),
        ],
        bnds: { type: glpk.GLP_UP, ub: 0, lb: 0 },
      });

      // served = weighted benefit: ≤ Σ w_s·n_{s}_{g}, ≤ M·prov. Continuous is
      // exact — maximization pushes it to the binding upper bound, which is a
      // sum of weighted integer counts whenever prov = 1.
      const sv = servedName(b, g);
      bounds.push({ name: sv, type: glpk.GLP_DB, lb: 0, ub: PARTY_SIZE * maxW });
      // Epsilon tie-break: prefer landing buffs in lower-index parties.
      // Weighted scores are ≥ 0.1 apart; the total epsilon contribution stays
      // well below that, so the true optimum is unchanged — but the plateau
      // of equivalent permutations collapses and branch & bound stops
      // crawling over ties.
      objectiveVars.push({ name: sv, coef: BUFFS[b].value + 0.00002 * (partyCount - g) });
      subjectTo.push({
        name: `sr_${b}_${g}`,
        vars: [
          { name: sv, coef: 1 },
          ...recipientSpecs.map(({ s, w }) => ({ name: nName(s, g), coef: -w })),
        ],
        bnds: { type: glpk.GLP_UP, ub: 0, lb: 0 },
      });
      subjectTo.push({
        name: `sp_${b}_${g}`,
        vars: [
          { name: sv, coef: 1 },
          { name: provName(b, g), coef: -PARTY_SIZE * maxW },
        ],
        bnds: { type: glpk.GLP_UP, ub: 0, lb: 0 },
      });
    }
  }

  // Totem-element exclusivity: a shaman keeps ONE continuous totem per
  // element up. Twistable totems (Windfury — its 9s buff persists across
  // swaps) can ride on top of a continuous aura, but ONLY specs that
  // actually twist (`twistsTotems`, i.e. enhancement) burn GCDs doing it —
  // a resto/ele shaman just plants one air totem. Per party and element:
  //   (a) Σ_{b non-twistable of e} prov[b][g] ≤ providers of e in g
  //   (b) Σ_{b any of e} prov[b][g] ≤ providers of e + twist-capable providers
  // (b) lets WF stand alone as a provider's continuous totem, or stack on an
  // aura only when a twister is present.
  for (const e of TOTEM_ELEMENTS) {
    const allElementBuffs = activeBuffs.filter((b) => BUFFS[b].element === e);
    if (allElementBuffs.length < 2) continue; // single option can't conflict
    const continuousBuffs = allElementBuffs.filter((b) => !BUFFS[b].twistable);
    const providerSpecs = specIds.filter((s) =>
      SPECS[s].provides.some((b) => BUFFS[b].element === e),
    );
    for (const g of parties) {
      if (continuousBuffs.length >= 2) {
        subjectTo.push({
          name: `elem_${e}_${g}`,
          vars: [
            ...continuousBuffs.map((b) => ({ name: provName(b, g), coef: 1 })),
            ...providerSpecs.map((s) => ({ name: nName(s, g), coef: -1 })),
          ],
          bnds: { type: glpk.GLP_UP, ub: 0, lb: 0 },
        });
      }
      subjectTo.push({
        name: `elemtot_${e}_${g}`,
        vars: [
          ...allElementBuffs.map((b) => ({ name: provName(b, g), coef: 1 })),
          // twist-capable providers contribute 2 slots (aura + pulsed WF),
          // merged into one coefficient — GLPK forbids duplicate indices.
          ...providerSpecs.map((s) => ({
            name: nName(s, g),
            coef: SPECS[s].twistsTotems ? -2 : -1,
          })),
        ],
        bnds: { type: glpk.GLP_UP, ub: 0, lb: 0 },
      });
    }
  }

  // Symmetry breaking: parties are interchangeable, so order them by size —
  // every layout has a size-sorted permutation, and this prunes most of the
  // remaining party-permutation tree.
  for (let g = 0; g + 1 < partyCount; g++) {
    subjectTo.push({
      name: `sym_${g}`,
      vars: [
        ...specIds.map((s) => ({ name: nName(s, g), coef: -1 })),
        ...specIds.map((s) => ({ name: nName(s, g + 1), coef: 1 })),
      ],
      bnds: { type: glpk.GLP_UP, ub: 0, lb: 0 },
    });
  }

  return {
    name: 'raidcomp',
    objective: {
      direction: glpk.GLP_MAX,
      name: 'buffscore',
      // glpk.js rejects an empty objective; anchor with a zero-coef var
      // (happens when no party buff has both a provider and a recipient).
      vars:
        objectiveVars.length > 0
          ? objectiveVars
          : [{ name: nName(specIds[0], 0), coef: 0 }],
    },
    subjectTo,
    bounds,
    binaries,
    generals,
  };
}
