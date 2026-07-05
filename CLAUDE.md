# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status

Implemented (Vite + vanilla JS + glpk.js). `README.md` is the original design spec; **the implementation has since evolved past it** — trust the code and the notes below where they disagree (notably: count-based ILP instead of per-player binaries, weighted `helps` maps instead of arrays, totem-element exclusivity, Grace of Air, `tank_paladin` role, Raid-Helper import, recruit suggestions).

Commands: `npm run dev` / `npm run build` / `npm test` (node-based solver tests in `test/solve.test.js` — glpk.js is isomorphic; includes a brute-force optimality cross-check that must stay green after any model change).

## What This Is

A **fully client-side** SPA (no backend) that computes buff-optimal party assignments for WoW: The Burning Crusade raids (10-man = 2 parties of 5, 25-man = 5 parties of 5). Given a roster of (class + spec) players, it assigns them to parties to maximize total party-local buff coverage, solved to provable optimality via Integer Linear Programming.

- Solver: [`glpk.js`](https://github.com/jvail/glpk.js) — WebAssembly GLPK with a JSON LP/MILP interface. `npm i glpk.js`; init async with `const glpk = await GLPK();`.
- Run the solve inside a **Web Worker** (`solver.worker.js`) so the UI never blocks.
- Persistence: URL query param (encoded roster) + JSON export/import. Not localStorage in artifact preview; localStorage OK for a standalone deploy.
- Faction-independent: race buffs ignored.

## Core Architectural Concept

The whole tool hinges on the distinction between **party-local** and **raid-global** buffs:

- **Party-local** buffs (Windfury, Totem of Wrath, Moonkin Aura, Wrath of Air, etc.) only affect the 5 players in the same party. These are the *only* thing the optimizer reasons about — grouping matters *because* of them.
- **Raid-global** buffs/debuffs (Misery, Curse of Elements, Battle Shout, Shadow Weaving) are identical for any valid assignment. **Keep them out of the ILP entirely**; add them as a flat constant to the displayed score.

All WoW-specific tuning (buff `value` weights, which specs `provide` which buffs, recipient roles) lives in exactly two data files — `buffs.js` and `specs.js`. Solver/model code must never hardcode a buff.

### Recipient roles

`caster`, `melee` (incl. **Ret paladin** and warrior/bear tanks), `ranged_phys` (hunters — **NOT Windfury**), `healer`, `tank_paladin` (prot pally: holy-damage threat → fractional weights on melee buffs, extra weight on Sanctity).

`helps` on a buff is a **role → weight map** (missing role = 0; fractions = partial benefit).

## The ILP Model (the hard part — READ src/model.js comments)

**Count-based, not per-player.** The naive per-player binary model (README §4) explodes at 24-25 players from symmetry (interchangeable same-spec players × interchangeable parties → >60s solves). Since names are cosmetic, the model aggregates:

- `n[s][g]` integer — how many players of spec `s` in party `g`.
- `prov[b][g]` binary — buff `b` provided in party `g`.
- `served[b][g]` continuous — weighted benefit of `b` in `g`; `≤ Σ w_s·n[s][g]`, `≤ 5·maxW·prov[b][g]`. Continuous is exact (maximization pushes to the binding bound).

Plus: party size cap ≤ 5; **totem-element exclusivity** (per party/element: active *non-twistable* totems ≤ providing-shamans; only Windfury is `twistable` — its 9s buff persists across swaps, so it rides on top of ONE continuous air aura; GoA+WoA can never coexist from a single shaman); size-ordering symmetry break; **epsilon tie-break** in the objective (+2e-5·party-index — collapses plateaus of equivalent optima that otherwise stall branch & bound; keep total ε below the 0.1-pt score granularity).

Solver opts (worker): `tmlim: 4`, `mipgap: 0.002` — benchmarks show the true optimum lands within ~1s even on hard 24-man rosters; the cap only trims the worthless optimality proof. Recruit-suggestion solves additionally inject the known lower bound (base score) as a constraint and cap at 1s — advisory numbers, speed over proof.

`decode.js` expands counts back to players and **recomputes** scores from the assignment (greedy per-element totem choice — provably matches the ILP optimum); it never trusts `res.z`. Zero-recipient buffs are hidden from display.

Perf invariants (test-enforced): 24-man solve < 3s, recruit ranking < 15s.

## Intended File Layout (from spec §7)

```
/src
  main.js            # UI bootstrap
  specs.js           # SPECS table  (roles + provides)  — WoW tuning
  buffs.js           # BUFFS table  (scope + helps + value) — WoW tuning
  model.js           # builds the glpk.js LP object from a roster
  solver.worker.js   # loads glpk.js, runs solve off main thread
  decode.js          # solver vars -> party assignments + score breakdown
  ui/ RosterEditor.js, PartyCard.js, ScorePanel.js
index.html
```

`decode.js` reads `res.result.vars` (a `varName -> 0/1` map) back into assignments. The `served` vars are also the source for the score breakdown / "unfilled potential" explanations that are the tool's main value.

## WoW Correctness Gotchas (get these right)

- **Windfury helps all melee including Ret paladin**; it does **not** help hunters (ranged autoshots don't proc it). Keep hunters as `ranged_phys`, Windfury `helps: ['melee']`, Ret `role: 'melee'`.
- Shadow Priest / Warlock / Mage raid debuffs are **global** — must not influence grouping.
- Wrath of Air, Mana Spring, Totem of Wrath, Strength of Earth are **party-local** (totems only affect the shaman's own party).
- Only ONE of each unique party aura/totem matters per party — the capped `prov` indicator handles this; never sum providers.
- Totem-element exclusivity (two same-element totems in one party) is an optional stretch constraint; base model ignores it.
- `value` numbers are relative weights, not sim data — tune freely.
