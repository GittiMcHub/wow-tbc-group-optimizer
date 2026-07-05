# TBC Raid Composition Optimizer

**Try it:** https://gittimchub.github.io/wow-tbc-group-optimizer/

## Features

- **Perfect groups, every raid** — enter your roster (class + spec), get the mathematically best 5-man party setup for your 10 or 25-man. Not "pretty good" — provably the best possible.
- **Knows TBC buffs cold** — Windfury, Totem of Wrath, Moonkin Aura, Wrath of Air, Grace of Air… everything that only works inside a party is what decides the groups.
- **No fake buffs** — Windfury buffs your Ret paladin but not your hunters. Prot paladins count as melee-ish for holy-threat. Shamans can't drop two earth totems at once. The tool knows all of it.
- **Totem twisting supported** — Windfury twisting is modeled correctly: it stacks on top of one other air totem, exactly like your enhancement shaman actually plays it.
- **See what you're missing** — per-group score breakdown shows which buffs each party gets and where potential is wasted.
- **Recruiting advice** — tells you which class/spec would boost your raid the most if you added one.
- **Raid-Helper import** — pull your signups straight from your Discord Raid-Helper event, no retyping.
- **Share with one link** — setup is encoded in the URL; paste it in your guild Discord and officers see the same roster.
- **Instant, private, free** — runs entirely in your browser. No account, no server, no data leaves your machine.

---

> **Note:** everything below is the original design spec. The implementation has since evolved past it (count-based ILP, weighted role maps, totem twisting, Raid-Helper import, recruit suggestions) — see `CLAUDE.md` and the code where they disagree.

A **fully client-side** web tool that computes the buff-optimal group layout for World of Warcraft: The Burning Crusade raids (10- and 25-man). Given a roster of players (class + spec), it assigns them to parties to maximize total raid buff coverage, using an Integer Linear Programming (ILP) solver running in the browser via WebAssembly.

Faction-independent: race buffs are ignored.

---

## 1. Goal

The core problem is a **group assignment optimization**:

- A 10-man raid = 2 parties of 5. A 25-man raid = 5 parties of 5.
- Many strong buffs are **party-local** (only affect the 5 players in the same party): Windfury Totem, Moonkin Aura, Leader of the Pack, Totem of Wrath, Improved Sanctity Aura, Ferocious Inspiration, etc.
- Other buffs/debuffs are **raid-global** (Misery, Curse of Elements, Shadow Weaving, Battle Shout, etc.) — these don't depend on grouping and can be ignored by the optimizer (or counted as a flat bonus).
- The optimizer must place party-local **providers** with the **recipients** that benefit most (e.g. Windfury with melee, Moonkin Aura with casters).

The output is the assignment of each player to a party that **maximizes total buff value**, solved to provable optimality with ILP.

---

## 2. Tech Stack

- **Frontend:** plain HTML/CSS/JS or a light framework (React/Vite is fine — keep it SPA, no backend).
- **Solver:** [`glpk.js`](https://github.com/jvail/glpk.js) — a WebAssembly port of GLPK with a JSON interface for LP/MILP. Runs entirely client-side.
  - Install: `npm i glpk.js`
  - Async init: `const glpk = await GLPK();`
  - **Run the solve inside a Web Worker** so the UI doesn't block (glpk.js supports worker usage; the solve is fast at this scale but keep it off the main thread for good UX).
- **Persistence:** roster saved to the URL (encoded query param) or a downloadable/uploadable JSON file. **Do NOT use localStorage in the artifact preview**, but for a standalone deployed app localStorage is fine.

---

## 3. Data Model

### 3.1 Buff catalog (`buffs.js`)

Each buff has: an id, a scope (`party` | `raid`), the recipient category it helps, and a base value.

```js
// recipient categories a buff can target
// "caster"  = spell DPS (mage, warlock, ele sham, boomkin, spriest)
// "melee"   = physical melee DPS (fury/arms war, enh sham, ret, feral, rogue)
// "ranged_phys" = hunters (share some melee buffs, not windfury)
// "healer"  = healing specs
// "all"     = everyone

export const BUFFS = {
  windfury_totem:      { scope: 'party', helps: ['melee'],               value: 10, note: 'All melee (War/Rogue/Enh/Ret); NOT hunters (ranged)' },
  totem_of_wrath:      { scope: 'party', helps: ['caster'],              value: 9 },
  moonkin_aura:        { scope: 'party', helps: ['caster'],              value: 5 },
  leader_of_the_pack:  { scope: 'party', helps: ['melee','ranged_phys'], value: 5 },
  improved_sanctity:   { scope: 'party', helps: ['melee'],              value: 4, note: '+2% holy/phys dmg (party)' },
  ferocious_insp:      { scope: 'party', helps: ['melee','ranged_phys','caster'], value: 3, note: 'BM hunter, +3% dmg party' },
  unleashed_rage:      { scope: 'party', helps: ['melee','ranged_phys'], value: 4, note: 'Enh, +AP party' },
  wrath_of_air:        { scope: 'party', helps: ['caster'],              value: 5, note: 'Air totem — party-local' },
  mana_spring:         { scope: 'party', helps: ['caster','healer'],     value: 3 },
  strength_of_earth:   { scope: 'party', helps: ['melee','ranged_phys'], value: 3 },

  // raid-global — included for scoring completeness but do not affect grouping
  misery:              { scope: 'raid',  helps: ['caster'],              value: 5 },
  shadow_weaving:      { scope: 'raid',  helps: ['caster'],              value: 4 },
  curse_of_elements:   { scope: 'raid',  helps: ['caster'],              value: 4 },
  battle_shout:        { scope: 'raid',  helps: ['melee','ranged_phys'], value: 3 },
  // ...extend as needed
};
```

### 3.2 Class/spec definitions (`specs.js`)

Each spec declares: which recipient category it belongs to (what it *wants*), and which party-buffs it *provides*.

```js
export const SPECS = {
  fury_warrior:     { role: 'melee',       provides: [] },
  arms_warrior:     { role: 'melee',       provides: [] },
  ret_paladin:      { role: 'melee',       provides: ['improved_sanctity'] },
  enh_shaman:       { role: 'melee',       provides: ['windfury_totem','unleashed_rage','strength_of_earth','wrath_of_air','mana_spring'] },
  feral_druid:      { role: 'melee',       provides: ['leader_of_the_pack'] },
  rogue:            { role: 'melee',       provides: [] },

  bm_hunter:        { role: 'ranged_phys', provides: ['ferocious_insp'] },
  mm_hunter:        { role: 'ranged_phys', provides: [] },
  surv_hunter:      { role: 'ranged_phys', provides: [] },

  fire_mage:        { role: 'caster',      provides: [] },
  frost_mage:       { role: 'caster',      provides: [] },
  arcane_mage:      { role: 'caster',      provides: [] },
  affli_warlock:    { role: 'caster',      provides: [] },
  destro_warlock:   { role: 'caster',      provides: [] },
  demo_warlock:     { role: 'caster',      provides: [] },
  ele_shaman:       { role: 'caster',      provides: ['totem_of_wrath','wrath_of_air','mana_spring'] },
  balance_druid:    { role: 'caster',      provides: ['moonkin_aura'] },
  shadow_priest:    { role: 'caster',      provides: [] }, // raid buffs are global

  // healers / tanks: role set accordingly, usually provides raid-global or party support
  resto_shaman:     { role: 'healer',      provides: ['mana_spring','wrath_of_air'] },
  holy_paladin:     { role: 'healer',      provides: [] },
  // ...tanks: prot_warrior, prot_paladin, feral_bear -> role 'melee' or 'tank'
};
```

> **Design note:** keep `value` numbers and `provides` lists in these two data files only. All the WoW-specific tuning lives here; the solver code below never hardcodes a buff.

---

## 4. The ILP Model

**Decision variables** (binary):

```
x[p][g] = 1  if player p is assigned to party g, else 0
```

**Provider indicator variables** (binary), one per (buff, party):

```
prov[b][g] = 1  if at least one provider of party-buff b is present in party g
```

**Constraints:**

1. **Each player in exactly one party:**
   for every player p:  Σ_g x[p][g] = 1

2. **Party size cap:**
   for every party g:  Σ_p x[p][g] ≤ 5
   (use `= 5` if the roster is exactly full; `≤ 5` allows under-full rosters)

3. **Provider linking** — `prov[b][g]` can only be 1 if some provider of `b` sits in `g`:
   for every party-buff b, party g:
     prov[b][g] ≤ Σ_{p provides b} x[p][g]
   (This upper-bounds the indicator; the objective pushes it to 1 when possible, so no lower-bound constraint is needed as long as the buff value is positive.)

**Objective — maximize total party-local buff value:**

```
maximize  Σ_b Σ_g  value(b) * ( number of recipients of b in party g, when prov[b][g]=1 )
```

The tricky part: the reward is `value(b)` times the count of *recipients* in the party, but only if a *provider* is also in the party. That's a product of two variables (bilinear), which ILP can't take directly. **Linearize** with a per-(buff, party, recipient) helper variable:

```
served[b][g][p] = 1  if player p (a recipient of buff b) is in party g AND buff b is provided in party g
```

with linking constraints:

```
served[b][g][p] ≤ x[p][g]          // p must be in the party
served[b][g][p] ≤ prov[b][g]       // buff must be provided in the party
```

(No lower bound needed because the objective maximizes `served`, so the solver sets it to 1 whenever both conditions allow.)

**Final objective:**

```
maximize  Σ_b Σ_g Σ_{p recipient of b}  value(b) * served[b][g][p]
```

Raid-global buffs are added as a constant to the score display (they're the same for any valid assignment) — leave them out of the ILP entirely.

### 4.1 Model size sanity check

25 players × 5 parties = 125 `x` vars. Party-buffs (~10) × 5 parties = 50 `prov` vars. `served` is bounded by (party-buffs × parties × recipients) ≈ 10 × 5 × 25 = 1250 in the worst case. That's tiny — glpk.js solves it in milliseconds.

---

## 5. glpk.js Call Shape

Build the model as the JSON structure glpk.js expects. Sketch:

```js
import GLPK from 'glpk.js';

async function solve(roster, partyCount) {
  const glpk = await GLPK();

  const objectiveVars = [];   // { name, coef }
  const subjectTo = [];       // constraints
  const binaries = [];        // all var names are binary

  // ... generate x[p][g], prov[b][g], served[b][g][p] var names,
  //     push objective coefs (value(b)) for each served var,
  //     push the constraints from section 4 ...

  const lp = {
    name: 'raidcomp',
    objective: { direction: glpk.GLP_MAX, name: 'buffscore', vars: objectiveVars },
    subjectTo,
    binaries,
  };

  const res = await glpk.solve(lp, { msglev: glpk.GLP_MSG_ERR });
  // res.result.vars is a map varName -> 0/1
  // decode x[p][g] == 1 to build the party assignment
  return decodeAssignment(res.result.vars, roster, partyCount);
}
```

Run this inside a **Web Worker** (`solver.worker.js`) and post the assignment back to the UI.

---

## 6. UI Requirements

- **Roster input:** add players by picking class + spec from dropdowns; name is optional/cosmetic. Support 10 or 25 mode (toggle sets `partyCount` to 2 or 5).
- **Validate** roster size vs mode (warn if > capacity; allow under-full).
- **"Optimize" button** → runs the worker → renders 5 party cards (or 2 for 10-man), each showing its members and the **active party buffs** in that group.
- **Score breakdown panel:** total score, plus which buffs landed where and how many recipients each served. This is the "why" behind the layout and the main value of the tool.
- **Explain unfilled potential:** e.g. "Windfury in Party 3 serves only 2 melee — consider moving a rogue here." (Optional stretch: derive from the served vars.)
- **Share/save:** encode roster to URL param and offer JSON export/import.

---

## 7. Suggested File Layout

```
/src
  main.js                # UI bootstrap
  specs.js               # SPECS table (section 3.2)
  buffs.js               # BUFFS table (section 3.1)
  model.js               # builds the glpk.js LP object from roster (section 4/5)
  solver.worker.js       # loads glpk.js, runs solve off main thread
  decode.js              # turns solver vars back into party assignments + score breakdown
  ui/
    RosterEditor.js
    PartyCard.js
    ScorePanel.js
index.html
```

---

## 8. Correctness Notes / Gotchas (WoW-specific)

- **Windfury helps all melee, including Ret Paladins** — Warriors, Rogues, Enhancement Shamans, *and* Ret. It procs on their autoattacks; the per-proc gain is lower than a slow-weapon Fury warrior's but it's still a real melee buff, so treat Ret as regular melee. Windfury does NOT help **Hunters** (ranged autoshots don't proc it), so keep Hunter specs as `role: 'ranged_phys'` and Windfury's `helps` as `['melee']`. The only role mapping that matters here: make sure Ret is `role: 'melee'`, not something separate.
- **Shadow Priest / Warlock / Mage raid debuffs are global**, not party-local — don't let them influence grouping.
- **Wrath of Air, Mana Spring, Totem of Wrath, Strength of Earth are party-local** (totems only affect the shaman's party). This is *the* reason grouping matters for casters.
- **Only ONE of each unique party aura/totem matters per party** — a second Moonkin in the same party adds nothing. The `prov[b][g]` indicator (capped at 1) handles this correctly; don't sum providers.
- **Two mutually exclusive totems** of the same element (e.g. Wrath of Air vs Windfury are different elements — OK; but Grace of Air vs Windfury are both Air) — if you model totem-element exclusivity, add a constraint that a party can't benefit from two same-element totems. This is a stretch refinement; the base model can ignore it.
- Tune the `value` numbers to taste — they're relative weights, not sim data. Consider letting the user edit weights in the UI.

---

## 9. Stretch Goals

- Editable buff weights in the UI (sliders) with live re-solve.
- Lock a player to a specific party (add constraint `x[p][g] = 1`).
- Totem-element exclusivity constraints.
- Multiple optimal layouts / show top-N by re-solving with a no-good cut.
- Preset "meta" rosters for common TBC raids (Kara, SSC, TK, Hyjal, BT).
