// Web Worker: loads glpk.js (WASM) and runs the solve off the main thread.
// Message in:  { roster, partyCount }
// Message out: { ok: true, result } | { ok: false, error }

import GLPK from 'glpk.js';
import { applyBuffValues } from './buffs.js';
import { buildModel, PARTY_SIZE } from './model.js';
import { decodeAssignment } from './decode.js';
import { computeRecruits } from './recruit.js';

const glpkPromise = GLPK();

self.onmessage = async (e) => {
  const { roster, partyCount, weights } = e.data;
  applyBuffValues(weights);
  // stage is an i18n key (+ params) — the main thread translates, so a
  // language switch mid-solve still renders correctly.
  const progress = (key, pct, params) => self.postMessage({ progress: { key, pct, params } });
  try {
    progress('progress.loading', 10);
    const glpk = await glpkPromise;
    progress('progress.building', 45);
    const lp = buildModel(roster, partyCount, glpk);
    progress('progress.solving', 65);
    // tmlim 4s: benchmarks show the true optimum is found within ~1s even on
    // hard 24-man rosters — beyond that branch & bound only grinds on the
    // optimality *proof*, which users don't need. Status GLP_FEAS = best
    // found at the cap. mipgap 0.2% additionally ends near-closed proofs.
    const res = await glpk.solve(lp, { msglev: glpk.GLP_MSG_ERR, tmlim: 4, mipgap: 0.002 });
    progress('progress.decoding', 88);
    const status = res.result.status;
    if (status !== glpk.GLP_OPT && status !== glpk.GLP_FEAS) {
      throw new Error(`Solver returned no feasible solution (status ${status})`);
    }
    const result = decodeAssignment(res.result.vars, roster, partyCount);

    // 1-4 open slots → rank candidate recruits by marginal score gain.
    const missing = partyCount * PARTY_SIZE - roster.length;
    if (missing >= 1 && missing <= 4) {
      result.recruits = await computeRecruits(
        glpk,
        roster,
        partyCount,
        result.partyScore,
        (done, total) => progress('progress.recruits', 88 + (done / total) * 12, { done, total }),
      );
      result.missingSlots = missing;
    }

    self.postMessage({ ok: true, result });
  } catch (err) {
    self.postMessage({ ok: false, error: String(err?.message ?? err) });
  }
};
